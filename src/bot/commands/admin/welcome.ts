import { appDisplayName, type AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordEmbed,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { commandHelpResponse, createEmbed, EMBED_COLORS, successEmbed } from '../../utils/embeds.js';

export const welcomeCommandDef: ApplicationCommand = {
  name: 'welcome',
  description: 'Configure welcome system for new members',
  default_member_permissions: '8',
  dm_permission: false,
  options: [
    {
      name: 'channel',
      description: 'Set the welcome channel',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'channel',
          description: 'Channel to send welcome messages',
          type: ApplicationCommandOptionType.CHANNEL,
          required: true,
          channel_types: [0, 5],
        },
      ],
    },
    {
      name: 'message',
      description: 'Set the welcome message template',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'content',
          description: 'Welcome message template (supports placeholders)',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'embed',
          description: 'Use embed format',
          type: ApplicationCommandOptionType.BOOLEAN,
          required: false,
        },
        {
          name: 'color',
          description: 'Embed color (hex, e.g. #06b6d4)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
        {
          name: 'thumbnail',
          description: 'Show user avatar as thumbnail',
          type: ApplicationCommandOptionType.BOOLEAN,
          required: false,
        },
        {
          name: 'banner',
          description: 'Banner image URL for embed',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
    {
      name: 'disable',
      description: 'Disable the welcome system',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'view',
      description: 'View current welcome configuration',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'test',
      description: 'Send a test welcome message',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
  ],
};

const DEFAULT_WELCOME_MESSAGE = 'Welcome {mention} to **{server}**! We are now {membercount} members. 🎉';

function embedResponse(embed: DiscordEmbed): InteractionResponse {
  return {
    type: 4,
    data: { embeds: [embed] },
  };
}

function errorResponse(title: string, description: string): InteractionResponse {
  return embedResponse(
    createEmbed({
      color: EMBED_COLORS.ERROR,
      title: `❌ ${title}`,
      description,
    }),
  );
}

function parseHexColor(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return parseInt(cleaned, 16);
}

export interface WelcomeConfig {
  channelId: string | null;
  message: string;
  embed: boolean;
  color: number | null;
  thumbnail: boolean;
  banner: string | null;
  enabled: boolean;
}

export function getWelcomeConfig(deps: AppDeps, guildId: string): WelcomeConfig {
  const channelId = deps.repo.getGuildSetting(guildId, 'welcome_channel_id') || null;
  const rawMessage = deps.repo.getGuildSetting(guildId, 'welcome_message');
  const rawColor = deps.repo.getGuildSetting(guildId, 'welcome_color');
  const rawBanner = deps.repo.getGuildSetting(guildId, 'welcome_banner');

  return {
    channelId,
    message: rawMessage && rawMessage.trim().length > 0 ? rawMessage : DEFAULT_WELCOME_MESSAGE,
    embed: deps.repo.getGuildSetting(guildId, 'welcome_embed') === '1',
    color: parseHexColor(rawColor ?? undefined),
    thumbnail: deps.repo.getGuildSetting(guildId, 'welcome_thumbnail') === '1',
    banner: rawBanner && rawBanner.trim().length > 0 ? rawBanner : null,
    enabled: Boolean(channelId),
  };
}

export function renderWelcomeMessage(
  template: string,
  args: { username: string; server: string; membercount: number | '?'; mention: string },
): string {
  return template
    .replace(/\{user\}/g, args.username)
    .replace(/\{server\}/g, args.server)
    .replace(/\{membercount\}/g, String(args.membercount))
    .replace(/\{mention\}/g, args.mention)
    .slice(0, 2000);
}

export interface WelcomeSender {
  sendChannelMessage(channelId: string, payload: { content?: string; embeds?: unknown[] }): Promise<void>;
}

export async function sendWelcomeMessage(
  bot: WelcomeSender,
  config: WelcomeConfig,
  args: { userId: string; displayName: string; server: string; memberCount: number | '?'; avatarUrl?: string | null },
): Promise<boolean> {
  if (!config.channelId) return false;

  const content = renderWelcomeMessage(config.message, {
    username: args.displayName,
    server: args.server,
    membercount: args.memberCount,
    mention: `<@${args.userId}>`,
  });

  try {
    if (config.embed) {
      const embed: DiscordEmbed = createEmbed({
        color: config.color ?? EMBED_COLORS.SUCCESS,
        description: content,
      });
      if (config.thumbnail && args.avatarUrl) {
        embed.thumbnail = { url: args.avatarUrl };
      }
      if (config.banner) {
        embed.image = { url: config.banner };
      }
      await bot.sendChannelMessage(config.channelId, { embeds: [embed] });
    } else {
      await bot.sendChannelMessage(config.channelId, { content });
    }
    return true;
  } catch {
    return false;
  }
}

export async function handleWelcomeCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return errorResponse('Server Settings Only', '`/welcome` can only be used inside a Discord server (guild).');
  }

  const subCommand = interaction.data?.options?.[0];
  if (!subCommand) {
    return welcomeHelp();
  }

  const options = subCommand.options ?? [];

  switch (subCommand.name) {
    case 'channel':
      return handleSetChannel(guildId, options, deps);
    case 'message':
      return handleSetMessage(guildId, options, deps);
    case 'disable':
      return handleDisable(guildId, deps);
    case 'view':
      return handleView(guildId, deps);
    case 'test':
      return handleTest(interaction, guildId, deps);
    default:
      return errorResponse('Unknown Subcommand', `\`${subCommand.name}\` is not a valid \`/welcome\` subcommand.`);
  }
}

function welcomeHelp(): InteractionResponse {
  return commandHelpResponse({
    name: 'welcome',
    description: 'Configure welcome system for new members with embed support',
    subcommands: [
      { name: 'channel', description: 'Set the welcome channel', options: [] },
      { name: 'message', description: 'Set the welcome message template', options: [] },
      { name: 'disable', description: 'Disable the welcome system', options: [] },
      { name: 'view', description: 'View current welcome configuration', options: [] },
      { name: 'test', description: 'Send a test welcome message', options: [] },
    ],
    examples: [
      '/welcome channel channel:#welcome',
      '/welcome message content:"Welcome {user} to {server}!" embed:True color:#06b6d4',
      '/welcome test',
      '/welcome view',
      '/welcome disable',
    ],
  });
}

function handleSetChannel(guildId: string, options: InteractionOption[], deps: AppDeps): InteractionResponse {
  const channelId = String(options.find((o) => o.name === 'channel')?.value ?? '').trim();
  if (!channelId) {
    return welcomeHelp();
  }

  deps.repo.setGuildSetting(guildId, 'welcome_channel_id', channelId);
  deps.repo.logActivity(null, 'info', 'bot', `Set welcome channel to ${channelId} for guild ${guildId} via /welcome`);

  return embedResponse(
    successEmbed(
      'Welcome Channel Set',
      `Welcome messages will be delivered to <#${channelId}>. Use \`/welcome message\` to customize the message and \`/welcome test\` to preview it.`,
    ),
  );
}

function handleSetMessage(guildId: string, options: InteractionOption[], deps: AppDeps): InteractionResponse {
  const content = String(options.find((o) => o.name === 'content')?.value ?? '').trim();
  const embedFlag = options.find((o) => o.name === 'embed')?.value;
  const rawColor = String(options.find((o) => o.name === 'color')?.value ?? '').trim();
  const thumbnailFlag = options.find((o) => o.name === 'thumbnail')?.value;
  const banner = String(options.find((o) => o.name === 'banner')?.value ?? '').trim();

  if (!content) {
    return welcomeHelp();
  }

  if (rawColor && !parseHexColor(rawColor)) {
    return errorResponse('Invalid Color', `\`${rawColor}\` is not a valid hex color. Use a format like \`#06b6d4\`.`);
  }

  const config = getWelcomeConfig(deps, guildId);
  const embed = embedFlag === undefined ? config.embed : Boolean(embedFlag);
  const thumbnail = thumbnailFlag === undefined ? config.thumbnail : Boolean(thumbnailFlag);

  deps.repo.setGuildSetting(guildId, 'welcome_message', content);
  deps.repo.setGuildSetting(guildId, 'welcome_embed', embed ? '1' : '0');
  deps.repo.setGuildSetting(guildId, 'welcome_thumbnail', thumbnail ? '1' : '0');
  if (rawColor) deps.repo.setGuildSetting(guildId, 'welcome_color', rawColor);
  if (banner) deps.repo.setGuildSetting(guildId, 'welcome_banner', banner);

  deps.repo.logActivity(null, 'info', 'bot', `Updated welcome message for guild ${guildId} via /welcome`);

  const fields = [
    { name: 'Message', value: content.slice(0, 256), inline: false },
    { name: 'Format', value: embed ? 'Embed' : 'Plain text', inline: true },
  ];
  if (rawColor) fields.push({ name: 'Color', value: rawColor, inline: true });
  if (thumbnail) fields.push({ name: 'Thumbnail', value: 'User avatar', inline: true });

  return embedResponse(successEmbed('Welcome Message Updated', undefined, fields));
}

function handleDisable(guildId: string, deps: AppDeps): InteractionResponse {
  deps.repo.setGuildSetting(guildId, 'welcome_channel_id', '');
  deps.repo.logActivity(null, 'info', 'bot', `Disabled welcome system for guild ${guildId} via /welcome`);

  return embedResponse(
    successEmbed('Welcome System Disabled', 'New member welcome messages have been turned off for this server.'),
  );
}

function handleView(guildId: string, deps: AppDeps): InteractionResponse {
  const config = getWelcomeConfig(deps, guildId);
  const binding = deps.repo.getGuildBinding(guildId);
  const guildName = (binding?.name || '').trim() || 'this server';

  return embedResponse(
    createEmbed({
      color: EMBED_COLORS.INFO,
      title: `👋 ${guildName} — Welcome Configuration`,
      description: config.enabled
        ? 'Welcome messages are **enabled**.'
        : 'Welcome messages are **disabled**. Set a channel with `/welcome channel` to enable.',
      fields: [
        { name: '📢 Channel', value: config.channelId ? `<#${config.channelId}>` : 'Not configured', inline: true },
        { name: '🎨 Format', value: config.embed ? 'Embed' : 'Plain text', inline: true },
        { name: '📝 Message', value: config.message.slice(0, 256), inline: false },
      ],
      footer: { text: `${appDisplayName(deps)} • /welcome view` },
    }),
  );
}

async function handleTest(
  interaction: DiscordInteraction,
  guildId: string,
  deps: AppDeps,
): Promise<InteractionResponse> {
  const config = getWelcomeConfig(deps, guildId);
  if (!config.channelId) {
    return errorResponse(
      'No Welcome Channel',
      'Set a welcome channel first with `/welcome channel channel:<channel>`.',
    );
  }

  const binding = deps.repo.getGuildBinding(guildId);
  const serverName = (binding?.name || '').trim() || 'this server';
  const memberCount = (await deps.bot?.getGuildMemberCount(guildId)) ?? '?';
  const userId = interaction.member?.user?.id || interaction.user?.id || '0';
  const username = interaction.member?.user?.global_name || interaction.member?.user?.username || 'Test User';
  const avatarUrl = interaction.member?.user?.avatar
    ? `https://cdn.discordapp.com/avatars/${userId}/${interaction.member.user.avatar}.png?size=128`
    : null;

  const sent = await sendWelcomeMessage(deps.bot!, config, {
    userId,
    displayName: username,
    server: serverName,
    memberCount,
    avatarUrl,
  });

  if (!sent) {
    return errorResponse(
      'Test Delivery Failed',
      `Could not deliver a message to <#${config.channelId}>. Check that the bot has permission to send messages there.`,
    );
  }

  return embedResponse(
    successEmbed('Test Welcome Sent', `A test welcome message was delivered to <#${config.channelId}>.`),
  );
}
