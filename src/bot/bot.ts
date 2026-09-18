import type http from 'node:http';
import { Client, REST, Routes, type Guild } from 'discord.js';
import type { AppDeps } from '../app.js';
import { createLogger, type Logger } from '../util/logger.js';
import { getEnabledCommands } from './handlers/registry.js';
import { registerBotEvents } from './handlers/events.js';
import { loadAllCommands } from './handlers/loader.js';
import { DiscordRestClient } from './rest.js';
import { BOT_DEFAULT_INTENTS } from './config.js';
import { createHelixRssServer } from '../dashboard/server.js';

export interface DiscordBotOptions {
  token: string;
  clientId: string | null;
  redirectUrl: string | null;
  callbackUrl?: string | null;
  port?: number;
  host?: string;
  startSite?: boolean;
}

export class DiscordBot {
  readonly logger: Logger;
  readonly rest: DiscordRestClient;
  private readonly client: Client;
  private server: http.Server | null = null;
  private isStarted = false;
  private ownerDiscordIds = new Set<string>();
  private teamAdminDiscordIds = new Set<string>();
  private applicationInfo: {
    id: string;
    name: string;
    icon?: string | null;
    bot?: { id: string; username: string; avatar?: string | null; global_name?: string | null; discriminator?: string };
  } | null = null;

  constructor(
    private readonly deps: AppDeps,
    private readonly options: DiscordBotOptions,
  ) {
    this.logger = createLogger('bot', deps.config.logLevel);
    this.rest = new DiscordRestClient(options.token, deps.config.discordApiBaseUrl);

    this.client = new Client({
      intents: [...BOT_DEFAULT_INTENTS],
    });

    registerBotEvents(this.client, this, this.deps);

    this.deps.bot = this;
  }

  async start(): Promise<void> {
    if (this.isStarted) return;
    this.isStarted = true;

    this.logger.info('Starting Discord Bot primary service...');
    await loadAllCommands();

    if (this.options.token) {
      await this.detectApplicationOwners();

      if (this.options.clientId) {
        try {
          const enabledCommands = getEnabledCommands(this.deps);
          this.logger.info('Registering global slash commands with Discord...', {
            commandsCount: enabledCommands.length,
            clientId: this.options.clientId,
          });
          const rest = new REST({ version: '10' }).setToken(this.options.token);
          await rest.put(Routes.applicationCommands(this.options.clientId), { body: enabledCommands });
          this.logger.info('Global slash commands registered successfully');
        } catch (err) {
          this.logger.error('Failed to register global slash commands', {
            err: (err as Error).message,
          });
        }
      } else {
        this.logger.warn(
          'DISCORD_CLIENT_ID not set; skipping automatic slash command registration. Set DISCORD_CLIENT_ID in .env to register commands.',
        );
      }

      this.client.login(this.options.token).catch((err) => {
        this.logger.error('Failed to login to Discord', { err: (err as Error).message });
      });
    } else {
      this.logger.warn('DISCORD_TOKEN not set; running bot in local web-only mode without Discord Gateway connection.');
    }

    if (this.options.port !== undefined && this.options.port >= 0) {
      const port = this.options.port;
      const host = this.options.host ?? '127.0.0.1';
      const server = createHelixRssServer(this.deps);
      this.server = server;

      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          this.logger.error(`Discord Bot port ${port} on ${host} is already in use.`);
        } else {
          this.logger.error('Discord Bot server error', { err: err.message });
        }
      });

      await new Promise<void>((resolve, reject) => {
        const onListening = () => {
          server.removeListener('error', onError);
          const address = server.address();
          if (typeof address === 'object' && address) {
            this.deps.config.port = address.port;
            this.deps.config.botPort = address.port;
          }
          this.logger.info('HELIX Discord Bot unified server listening', {
            host,
            port: this.deps.config.port,
          });
          resolve();
        };

        const onError = (err: NodeJS.ErrnoException) => {
          server.removeListener('listening', onListening);
          reject(err);
        };

        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, host);
      });
    }
  }

  async handleGuildDelete(guild: Guild): Promise<void> {
    this.logger.info('Handling GUILD_DELETE: Bot removed from guild or guild deleted', { guildId: guild.id });
    try {
      const result = this.deps.repo.deleteGuildData(guild.id);
      this.logger.info(`Cleaned up guild ${guild.id} data`, {
        feedsDeleted: result.feedsDeleted,
        guildsDeleted: result.guildsDeleted,
      });
    } catch (err) {
      this.logger.error('Failed to clean up guild data after GUILD_DELETE', {
        guildId: guild.id,
        err: (err as Error).message,
      });
    }
  }

  private cachedGuildsWithChannels: Array<{
    id: string;
    name: string;
    icon: string | null;
    channels: Array<{ id: string; name: string; type: number; position?: number; nsfw?: boolean }>;
  }> | null = null;
  private cachedGuildsTimestamp = 0;

  async getGuildsWithChannels(): Promise<
    Array<{
      id: string;
      name: string;
      icon: string | null;
      channels: Array<{ id: string; name: string; type: number; position?: number; nsfw?: boolean }>;
    }>
  > {
    const now = Date.now();
    if (this.cachedGuildsWithChannels && now - this.cachedGuildsTimestamp < 15_000) {
      return this.cachedGuildsWithChannels;
    }

    try {
      const guilds = this.client.guilds.cache;
      const results = await Promise.all(
        guilds.map(async (guild) => {
          try {
            const channels = await guild.channels.fetch();
            return {
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
              channels: channels
                .filter((c) => c !== null)
                .map((c) => ({
                  id: c.id,
                  name: c.name ?? 'unknown',
                  type: c.type,
                  position: (c as unknown as { position?: number }).position ?? 0,
                  nsfw:
                    (c as { nsfw?: boolean }).nsfw ??
                    ((c as { isThread?: () => boolean }).isThread?.()
                      ? ((c as unknown as { parent?: { nsfw?: boolean } }).parent?.nsfw ?? false)
                      : false),
                })),
            };
          } catch {
            return {
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
              channels: [],
            };
          }
        }),
      );
      this.cachedGuildsWithChannels = results;
      this.cachedGuildsTimestamp = now;
      return results;
    } catch {
      return this.cachedGuildsWithChannels ?? [];
    }
  }

  async sendChannelMessage(channelId: string, payload: { content?: string; embeds?: unknown[] }): Promise<void> {
    await this.rest.sendChannelMessage(channelId, payload);
  }

  async getGuildChannelsAll(
    guildId: string,
  ): Promise<Array<{ id: string; name: string; type: number; position?: number; nsfw?: boolean }>> {
    return this.rest.getGuildChannelsAll(guildId);
  }

  async getGuildMemberCount(guildId: string): Promise<number | null> {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) return null;
    try {
      await guild.members.fetch();
    } catch {
      return guild.memberCount ?? null;
    }
    return guild.memberCount ?? null;
  }

  async getGuildRoles(guildId: string): Promise<Array<{ id: string; name: string; color: number; position: number }>> {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return [];
      const roles = await guild.roles.fetch();
      return roles
        .map((r) => ({ id: r.id, name: r.name, color: r.color, position: r.position }))
        .sort((a, b) => b.position - a.position);
    } catch {
      return [];
    }
  }

  async getGuildMember(
    guildId: string,
    userId: string,
  ): Promise<{
    id: string;
    username: string;
    globalName: string | null;
    avatar: string | null;
    nickname: string | null;
    bot: boolean;
    joinedAt: string | null;
    roles: Array<{ id: string; name: string; color: number; position: number }>;
  } | null> {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return null;
      const member = await guild.members.fetch(userId);
      const roles = [...member.roles.cache.values()]
        .map((r) => ({ id: r.id, name: r.name, color: r.color, position: r.position }))
        .sort((a, b) => b.position - a.position);
      return {
        id: member.user.id,
        username: member.user.username,
        globalName: member.user.globalName ?? null,
        avatar: member.user.avatar ?? null,
        nickname: member.nickname ?? null,
        bot: member.user.bot,
        joinedAt: member.joinedAt ? member.joinedAt.toISOString() : null,
        roles,
      };
    } catch {
      return null;
    }
  }

  async getChannel(threadId: string): Promise<{ id: string; name: string; type: number; nsfw?: boolean }> {
    return this.rest.getChannel(threadId);
  }

  async createForumThread(
    forumChannelId: string,
    payload: {
      name: string;
      message?: { content?: string; embeds?: unknown[] } | null;
      autoArchiveDuration?: number;
    },
  ): Promise<{ id: string; name: string; type: number }> {
    return this.rest.createForumThread(forumChannelId, payload);
  }

  async archiveThread(threadId: string): Promise<void> {
    await this.rest.archiveThread(threadId);
  }

  async unarchiveThread(threadId: string): Promise<void> {
    await this.rest.unarchiveThread(threadId);
  }

  async detectApplicationOwners(): Promise<{ ownerIds: string[]; adminIds: string[] }> {
    try {
      const app = await this.rest.getCurrentApplication();
      this.applicationInfo = app;
      const owners = new Set<string>();
      const admins = new Set<string>();

      if (app.owner?.id) {
        owners.add(app.owner.id);
      }

      if (app.team) {
        if (app.team.owner_user_id) {
          owners.add(app.team.owner_user_id);
        }
        for (const m of app.team.members || []) {
          if (m.membership_state === 2) {
            owners.add(m.user.id);
            admins.add(m.user.id);
          }
        }
      }

      this.ownerDiscordIds = owners;
      this.teamAdminDiscordIds = admins;
      this.logger.info('Detected Discord Application details from Portal', {
        appName: app.name,
        hasIcon: Boolean(app.icon || app.bot?.avatar),
        teamCount: owners.size,
        teamIds: Array.from(owners),
      });

      return {
        ownerIds: Array.from(owners),
        adminIds: Array.from(admins),
      };
    } catch (err) {
      this.logger.warn('Could not auto-detect application owner from Discord API', {
        err: (err as Error).message,
      });
      return { ownerIds: [], adminIds: [] };
    }
  }

  getApplicationInfo(): {
    id: string;
    name: string;
    icon?: string | null;
    bot?: { id: string; username: string; avatar?: string | null; global_name?: string | null; discriminator?: string };
  } | null {
    return this.applicationInfo;
  }

  getAppName(): string {
    return (
      this.applicationInfo?.name ||
      this.applicationInfo?.bot?.global_name ||
      this.applicationInfo?.bot?.username ||
      'HELIX Discord Bot'
    );
  }

  getAppIconUrl(): string | null {
    if (this.applicationInfo?.icon && this.applicationInfo?.id) {
      return `https://cdn.discordapp.com/app-icons/${this.applicationInfo.id}/${this.applicationInfo.icon}.png?size=128`;
    }
    if (this.applicationInfo?.bot?.avatar && this.applicationInfo?.bot?.id) {
      return `https://cdn.discordapp.com/avatars/${this.applicationInfo.bot.id}/${this.applicationInfo.bot.avatar}.png?size=128`;
    }
    return null;
  }

  getOwnerDiscordIds(): string[] {
    return Array.from(this.ownerDiscordIds);
  }

  getClient(): Client {
    return this.client;
  }

  isOwnerDiscordId(discordUserId: string): boolean {
    return this.ownerDiscordIds.has(discordUserId);
  }

  isOwnerOrAdminDiscordId(discordUserId: string): boolean {
    return this.ownerDiscordIds.has(discordUserId) || this.teamAdminDiscordIds.has(discordUserId);
  }

  async getUserVoiceChannelId(guildId: string, userId: string): Promise<string | null> {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) return null;
    const state = guild.voiceStates.cache.get(userId);
    return state?.channelId ?? null;
  }

  stop(): void {
    if (!this.isStarted) return;
    this.isStarted = false;
    this.client.destroy();
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.logger.info('Discord Bot stopped');
  }
}
