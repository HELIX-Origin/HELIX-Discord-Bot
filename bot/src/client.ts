import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import pc from 'picocolors';
import { botCommands } from './commands/index.js';
import { logger } from './utils/logger/index.js';

export class HelixBotClient {
  private static instance: HelixBotClient | null = null;
  private client: Client;
  private commands: Collection<string, any>;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
    });

    this.commands = new Collection();
    for (const cmd of botCommands) {
      this.commands.set(cmd.data.name, cmd);
    }

    this.registerEvents();
    HelixBotClient.instance = this;
  }

  public static getInstance(): HelixBotClient | null {
    return HelixBotClient.instance;
  }

  public isReady(): boolean {
    return this.client.isReady();
  }

  public getGatewayLatency(): number {
    return this.client.ws ? this.client.ws.ping : -1;
  }

  public getGuildsCache(): Array<{
    id: string;
    name: string;
    memberCount: number;
    channelCount: number;
    joinedTimestamp: number | null;
  }> {
    if (!this.client.isReady()) return [];
    return this.client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      joinedTimestamp: guild.joinedTimestamp,
    }));
  }

  public async sendChannelMessage(channelId: string, content: string): Promise<boolean> {
    if (!this.client.isReady()) return false;
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel && channel.isTextBased() && 'send' in channel) {
        await (channel as any).send(content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Verifies if a given Discord user ID belongs to the bot application owner or team.
   * Ensures API keys provided by the environment or secrets are strictly reserved for the owner.
   */
  public async isOwner(userId: string): Promise<boolean> {
    if (!userId) return false;

    // 1. Check optional environment variable override (e.g. BOT_OWNER_ID or DISCORD_OWNER_ID)
    const envOwner = process.env.DISCORD_OWNER_ID || process.env.BOT_OWNER_ID;
    if (envOwner && envOwner.trim() === userId) {
      return true;
    }

    // 2. Query Discord API for application owner information
    try {
      let app: any = this.client.application;
      if (!app?.owner && typeof app?.fetch === 'function') {
        await app.fetch();
        app = this.client.application;
      }

      if (!app) return false;

      const owner = app.owner;
      if (!owner) return false;

      // If owner is a single user
      if ('id' in owner && owner.id === userId) {
        return true;
      }

      // If owner is a Developer Team
      if ('members' in owner && (owner as any).members) {
        const members = (owner as any).members;
        if (typeof members.some === 'function') {
          return members.some((m: any) => m.id === userId || m.user?.id === userId);
        }
      }
    } catch {}

    return false;
  }

  private registerEvents(): void {
    this.client.once(Events.ClientReady, (readyClient) => {
      logger.success(`HELIX Discord Bot is online! Connected as: ${pc.bold(readyClient.user.tag)}`);
      logger.info(`Serving ${readyClient.guilds.cache.size} server(s)`);

      try {
        readyClient.user.setActivity('/helix-help | Developer Suite', { type: 3 }); // ActivityType.Watching = 3
      } catch {}
    });

    this.client.on(Events.GuildCreate, async (guild) => {
      logger.info(`Joined new guild: ${pc.bold(guild.name)} (${guild.id}) with ${guild.memberCount} members`);
      try {
        if (guild.systemChannel && guild.systemChannel.isTextBased()) {
          const welcomeEmbed = {
            title: '🧬 Thank you for inviting HELIX!',
            description: 'HELIX provides an all-in-one developer suite directly inside your Discord server: multi-framework project scaffolding, AI code synthesis, code explanations, and repository automation.',
            color: 0x00d2ff,
            fields: [
              { name: 'Get Started', value: 'Type `/helix-help` to browse all available commands.', inline: true },
              { name: 'Scaffold Projects', value: 'Use `/helix-create` to generate blueprints across 14 frameworks.', inline: true },
              { name: 'AI Assistance', value: 'Use `/helix-ai` to ask coding questions or generate code.', inline: true },
            ],
            footer: { text: 'HELIX Developer Suite • Zero-Cost SQLite Persistence' },
          };
          await (guild.systemChannel as any).send({ embeds: [welcomeEmbed] });
        }
      } catch {}
    });

    this.client.on(Events.GuildDelete, (guild) => {
      logger.info(`Removed from guild: ${guild.name} (${guild.id})`);
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error: any) {
        logger.error(`Error executing ${interaction.commandName}: ${error.message}`);
        const replyContent = { content: '❌ An error occurred while executing this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyContent);
        } else {
          await interaction.reply(replyContent);
        }
      }
    });
  }

  public async start(token: string): Promise<void> {
    await this.client.login(token);
  }

  public async stop(): Promise<void> {
    await this.client.destroy();
  }
}

/**
 * Convenience helper to determine if a Discord user is the bot's application owner.
 */
export async function isBotOwner(userId: string): Promise<boolean> {
  const instance = HelixBotClient.getInstance();
  if (instance) {
    return instance.isOwner(userId);
  }
  const envOwner = process.env.DISCORD_OWNER_ID || process.env.BOT_OWNER_ID;
  return Boolean(envOwner && envOwner.trim() === userId);
}

