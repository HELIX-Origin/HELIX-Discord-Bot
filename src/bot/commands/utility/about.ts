import type { AppDeps } from '../../../app.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';

// ── Command Definition ────────────────────────────────────────────────────────

export const aboutCommandDef: ApplicationCommand = {
  name: 'about',
  description: 'Show information about the bot, a server member, or this guild',
  options: [
    {
      name: 'bot',
      description: 'About HELIX Discord Bot — features, runtime, and links',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'user',
      description: 'Show information about a server member',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'user',
          description: 'The user to look up (defaults to yourself)',
          type: ApplicationCommandOptionType.USER,
          required: false,
        },
      ],
    },
    {
      name: 'guild',
      description: 'Show information about this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
  ],
};

// ── Shared Utilities ──────────────────────────────────────────────────────────

const DISCORD_EPOCH = 1420070400000n;
const MAX_ROLE_MENTIONS = 20;

function snowflakeDate(id: string | null | undefined): string | null {
  if (!id || !/^\d+$/.test(id)) return null;
  try {
    return new Date(Number((BigInt(id) >> 22n) + DISCORD_EPOCH)).toISOString();
  } catch {
    return null;
  }
}

function avatarUrl(id: string, hash: string | null | undefined): string {
  if (hash) {
    const ext = hash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=256`;
  }
  const index = Number((BigInt(id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function guildIconUrl(guildId: string, hash: string | null | undefined): string | null {
  if (!hash) return null;
  const ext = hash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${hash}.${ext}?size=256`;
}

function discordTimestamp(iso: string | null): string {
  if (!iso) return 'Unknown';
  const seconds = Math.floor(Date.parse(iso) / 1000);
  return `<t:${seconds}:F> (<t:${seconds}:R>)`;
}

// ── Subcommand Handlers ───────────────────────────────────────────────────────

async function handleBotSubcommand(deps: AppDeps): Promise<InteractionResponse> {
  const uptimeSec = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

  const dashboardUrl = deps.config.publicBaseUrl || deps.config.internalUrl;
  const inviteUrl = deps.config.redirectUrl;

  const h = EmbedHandler.for(deps).primary();

  h.title('About', '⚡').description(
    `**${deps.bot?.getAppName() ?? 'HELIX Discord Bot'}** is a feature-rich, multipurpose Discord bot for RSS/Atom feeds, live stream alerts, free game notifications, and guild administration.`,
  );

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    {
      name: '📡 RSS/Atom & Scrape Feeds',
      value: 'Automatic polling, deduplication, and rich embeds with primary images',
      inline: true,
    },
    {
      name: '📺 Stream Alerts (YouTube/Twitch)',
      value: 'Live/online notifications via WebSub + polling fallback',
      inline: true,
    },
    { name: '🎮 Free Game Alerts', value: 'Daily Epic Games Store free game notifications', inline: true },
    {
      name: '🛡️ Guild Administration',
      value: 'Moderation, tickets, welcome system, roles, and voice controls',
      inline: true,
    },
    {
      name: '😂 Entertainment (Deprecated)',
      value: 'GIF commands via KLIPY API (broken; discontinued in next update)',
      inline: true,
    },
    { name: '🎛️ Web Dashboard', value: 'Light & Dark themes with live logs and per-feed management', inline: true },
    { name: '⚙️ Runtime', value: 'Native Node.js & TypeScript ESM (zero runtime dependencies)', inline: true },
    { name: '💾 Storage', value: 'In-memory AppState with SQLite write-through persistence', inline: true },
    { name: '⏱️ Uptime', value: uptimeStr, inline: true },
    { name: '🖥️ Dashboard', value: `[Open Dashboard](${dashboardUrl})`, inline: true },
  ];

  if (deps.config.repoUrl) {
    fields.push({
      name: '📂 Source Code',
      value: `[${deps.config.repoUrl.replace(/^https?:\/\//i, '')}](${deps.config.repoUrl})`,
      inline: true,
    });
  }

  if (inviteUrl) {
    fields.push({ name: '🤖 Bot Invite', value: `[Add to Server](${inviteUrl})`, inline: true });
  }

  h.fields(fields).footer('HELIX Discord Bot');
  return h.respond();
}

async function handleUserSubcommand(interaction: DiscordInteraction, deps: AppDeps): Promise<InteractionResponse> {
  const guildId = interaction.guild_id ?? null;
  const self = interaction.member?.user ?? interaction.user ?? null;

  // The user option is nested under the `user` subcommand options
  const subOptions = interaction.data?.options?.find((o) => o.name === 'user')?.options ?? [];
  const rawId = subOptions.find((o) => o.name === 'user' || o.name === 'member')?.value;
  const targetId = (typeof rawId === 'string' ? rawId : self?.id) ?? null;

  if (!targetId) {
    return EmbedHandler.for(deps)
      .error()
      .title('No User')
      .description('Could not determine a user to display.')
      .respond(true);
  }

  let username = self?.username ?? 'unknown';
  let displayName = self?.global_name || self?.username || 'Unknown';
  let avatarHash: string | null = self?.avatar ?? null;
  let nickname: string | null = null;
  let isBot = false;
  let joinedAt: string | null = null;
  let roleMentions: string[] = [];

  if (guildId && deps.bot) {
    const member = await deps.bot.getGuildMember(guildId, targetId).catch(() => null);
    if (member) {
      username = member.username;
      displayName = member.nickname || member.globalName || member.username;
      avatarHash = member.avatar;
      nickname = member.nickname;
      isBot = member.bot;
      joinedAt = member.joinedAt;
      roleMentions = member.roles
        .filter((role) => role.name !== '@everyone')
        .slice(0, MAX_ROLE_MENTIONS)
        .map((role) => `<@&${role.id}>`);
    }
  }

  const h = EmbedHandler.for(deps).info();

  h.title(displayName, 'ℹ️')
    .description(`<@${targetId}>`)
    .field('👤 Username', `@${username}`, true)
    .field('🆔 User ID', `\`${targetId}\``, true)
    .field('📅 Account Created', discordTimestamp(snowflakeDate(targetId)), true);

  if (nickname && nickname !== username) h.field('🏷️ Nickname', nickname, true);
  if (joinedAt) h.field('📥 Joined Server', discordTimestamp(joinedAt), true);
  h.field('🤖 Bot', isBot ? 'Yes' : 'No', true);
  if (roleMentions.length > 0) h.section(`🎭 Roles (${roleMentions.length})`, roleMentions.join(' '));

  h.thumbnail(avatarUrl(targetId, avatarHash)).footer('User Info');
  return h.respond();
}

async function handleGuildSubcommand(interaction: DiscordInteraction, deps: AppDeps): Promise<InteractionResponse> {
  const guildId = interaction.guild_id ?? null;

  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('Use `/about guild` inside a server to view server information.')
      .respond(true);
  }

  let name = 'This Server';
  let iconHash: string | null = null;
  let channelCount: number | null = null;

  if (deps.bot) {
    const guilds = await deps.bot.getGuildsWithChannels().catch(() => []);
    const guild = guilds.find((g) => g.id === guildId);
    if (guild) {
      name = guild.name;
      iconHash = guild.icon;
      channelCount = guild.channels.length;
    }
  }

  const memberCount = deps.bot ? await deps.bot.getGuildMemberCount(guildId).catch(() => null) : null;
  const roles = deps.bot ? await deps.bot.getGuildRoles(guildId).catch(() => []) : [];

  const h = EmbedHandler.for(deps).info();

  h.title(name, 'ℹ️')
    .field('🆔 Server ID', `\`${guildId}\``, true)
    .field('📅 Created', discordTimestamp(snowflakeDate(guildId)), true)
    .field('👥 Members', memberCount === null ? 'Unknown' : `${memberCount}`, true)
    .field('📚 Channels', channelCount === null ? 'Unknown' : `${channelCount}`, true)
    .field('🎭 Roles', `${roles.length}`, true);

  const icon = guildIconUrl(guildId, iconHash);
  if (icon) h.thumbnail(icon);

  return h.footer('Server Info').respond();
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export async function handleAboutCommand(interaction: DiscordInteraction, deps: AppDeps): Promise<InteractionResponse> {
  const sub = interaction.data?.options?.[0]?.name ?? 'bot';

  switch (sub) {
    case 'user':
      return handleUserSubcommand(interaction, deps);
    case 'guild':
      return handleGuildSubcommand(interaction, deps);
    case 'bot':
    default:
      return handleBotSubcommand(deps);
  }
}

// ── Metadata & Export ─────────────────────────────────────────────────────────

registerCommandMetadata({
  name: 'about',
  description: 'Show information about the bot, a server member, or this guild',
  category: 'utility',
  emoji: '⚡',
  usage: '/about bot | /about user [@user] | /about guild',
  options: aboutCommandDef.options,
  examples: ['/about bot', '/about user', '/about user user:@username', '/about guild'],
});

export const aboutCommand: BotCommand = {
  def: aboutCommandDef,
  category: 'utility',
  execute: handleAboutCommand,
};
