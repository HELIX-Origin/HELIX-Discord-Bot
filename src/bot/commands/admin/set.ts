import { appDisplayName, type AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  type ApplicationCommand,
  type DiscordEmbed,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { commandHelpResponse, createEmbed, EMBED_COLORS, successEmbed } from '../../utils/embeds.js';
import type { FeedCategory } from '../../../state/types.js';

export const setCommandDef: ApplicationCommand = {
  name: 'set',
  description: 'Configure guild settings (channels, roles, permissions, features)',
  default_member_permissions: '8',
  dm_permission: false,
  options: [
    {
      name: 'channel',
      description: 'Set delivery channel for a feed category',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'category',
          description: 'Feed category',
          type: ApplicationCommandOptionType.STRING,
          required: true,
          choices: [
            { name: 'RSS/Atom Feeds', value: 'rss' },
            { name: 'Reddit Feeds', value: 'reddit' },
            { name: 'Free Games', value: 'freegames' },
            { name: 'Stream Alerts (YouTube/Twitch)', value: 'streamalerts' },
          ],
        },
        {
          name: 'channel',
          description: 'Target Discord text/announcement channel',
          type: ApplicationCommandOptionType.CHANNEL,
          required: true,
          channel_types: [0, 5],
        },
        {
          name: 'thread_channel',
          description: 'Optional forum channel for thread delivery',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [15],
        },
      ],
    },
    {
      name: 'role',
      description: 'Configure role-based permissions',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'dj',
          description: 'Set the DJ role for music commands',
          type: ApplicationCommandOptionType.ROLE,
          required: false,
        },
        {
          name: 'admin',
          description: 'Set a role that can manage feeds and bot settings',
          type: ApplicationCommandOptionType.ROLE,
          required: false,
        },
        {
          name: 'clear',
          description: 'Remove a configured role',
          type: ApplicationCommandOptionType.STRING,
          required: false,
          choices: [
            { name: 'DJ Role', value: 'dj' },
            { name: 'Admin Role', value: 'admin' },
          ],
        },
      ],
    },
    {
      name: 'feature',
      description: 'Enable or disable features for this guild',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'name',
          description: 'Feature to toggle',
          type: ApplicationCommandOptionType.STRING,
          required: true,
          choices: [
            { name: 'Feeds (RSS/Reddit/Free Games)', value: 'feeds' },
            { name: 'Stream Alerts (YouTube/Twitch)', value: 'streamalerts' },
            { name: 'Thread Delivery', value: 'threads' },
            { name: 'Music (Lavalink)', value: 'music' },
            { name: 'GIF Commands', value: 'gifs' },
          ],
        },
        {
          name: 'enabled',
          description: 'Enable or disable the feature',
          type: ApplicationCommandOptionType.BOOLEAN,
          required: true,
        },
      ],
    },
    {
      name: 'prefix',
      description: 'Set a custom command prefix for this guild',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'value',
          description: 'Prefix string (e.g. "!", "?", ".") - empty to reset',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
    {
      name: 'view',
      description: 'View current guild configuration',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'reset',
      description: 'Reset a setting to default',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'target',
          description: 'What to reset',
          type: ApplicationCommandOptionType.STRING,
          required: true,
          choices: [
            { name: 'All Channels', value: 'channels' },
            { name: 'All Roles', value: 'roles' },
            { name: 'All Features', value: 'features' },
            { name: 'Prefix', value: 'prefix' },
            { name: 'Everything', value: 'all' },
          ],
        },
      ],
    },
  ],
};

const FEED_CATEGORIES: readonly FeedCategory[] = ['rss', 'reddit', 'freegames', 'streamalerts'];

const CATEGORY_LABELS: Record<FeedCategory, string> = {
  rss: 'RSS / Atom Feeds',
  reddit: 'Reddit Feeds',
  freegames: 'Free Games',
  streamalerts: 'Stream Alerts (YouTube/Twitch)',
};

const FEATURE_NAMES = ['feeds', 'streamalerts', 'threads', 'music', 'gifs'] as const;

const FEATURE_LABELS: Record<(typeof FEATURE_NAMES)[number], string> = {
  feeds: 'Feeds (RSS/Reddit/Free Games)',
  streamalerts: 'Stream Alerts (YouTube/Twitch)',
  threads: 'Thread Delivery',
  music: 'Music (Lavalink)',
  gifs: 'GIF Commands',
};

const RESET_TARGETS = ['channels', 'roles', 'features', 'prefix', 'all'] as const;

const setHelp = (): InteractionResponse =>
  commandHelpResponse({
    name: 'set',
    description: 'Configure guild settings (channels, roles, permissions, features)',
    subcommands: [
      { name: 'channel', description: 'Set delivery channel for a feed category', options: [] },
      { name: 'role', description: 'Configure role-based permissions', options: [] },
      { name: 'feature', description: 'Enable/disable features for this guild', options: [] },
      { name: 'prefix', description: 'Set custom command prefix', options: [] },
      { name: 'view', description: 'View current guild configuration', options: [] },
      { name: 'reset', description: 'Reset a setting to default', options: [] },
    ],
    examples: [
      '/set channel category:rss channel:#news',
      '/set role dj:@MusicRole',
      '/set feature name:music enabled:True',
      '/set prefix value:!',
      '/set view',
      '/set reset target:channels',
    ],
  });

function embedResponse(embed: DiscordEmbed): InteractionResponse {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
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

export async function handleSetCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return errorResponse('Server Settings Only', '`/set` can only be used inside a Discord server (guild).');
  }

  const subCommand = interaction.data?.options?.[0];
  if (!subCommand) {
    return setHelp();
  }

  const user = deps.repo.getOrCreateGuildUser(guildId);
  const options = subCommand.options ?? [];

  switch (subCommand.name) {
    case 'channel':
      return handleSetChannel(user.id, guildId, options, deps);
    case 'role':
      return handleSetRole(user.id, guildId, options, deps);
    case 'feature':
      return handleSetFeature(user.id, guildId, options, deps);
    case 'prefix':
      return handleSetPrefix(user.id, guildId, options, deps);
    case 'view':
      return handleSetView(user.id, guildId, deps);
    case 'reset':
      return handleSetReset(user.id, guildId, options, deps);
    default:
      return errorResponse('Unknown Subcommand', `\`${subCommand.name}\` is not a valid \`/set\` subcommand.`);
  }
}

function handleSetChannel(
  userId: number,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
): InteractionResponse {
  const rawCategory = String(options.find((o) => o.name === 'category')?.value ?? '').trim();
  const channelId = String(options.find((o) => o.name === 'channel')?.value ?? '').trim();
  const threadChannelId = String(options.find((o) => o.name === 'thread_channel')?.value ?? '').trim() || null;

  const category = (FEED_CATEGORIES as readonly string[]).includes(rawCategory) ? (rawCategory as FeedCategory) : null;

  if (!category || !channelId) {
    return setHelp();
  }

  deps.repo.setGuildCategoryTarget(guildId, category, channelId, threadChannelId);
  deps.repo.logActivity(
    userId,
    'info',
    'bot',
    `Set ${category} delivery channel (${channelId}${threadChannelId ? `, threads ${threadChannelId}` : ''}) for guild ${guildId} via /set`,
  );

  return embedResponse(
    successEmbed(
      'New Delivery Channel Set',
      `**${CATEGORY_LABELS[category]}** will now be delivered to <#${channelId}>${threadChannelId ? ` with thread delivery in <#${threadChannelId}>` : ''}.`,
    ),
  );
}

function handleSetRole(
  userId: number,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
): InteractionResponse {
  const djRole = String(options.find((o) => o.name === 'dj')?.value ?? '').trim();
  const adminRole = String(options.find((o) => o.name === 'admin')?.value ?? '').trim();
  const clear = String(options.find((o) => o.name === 'clear')?.value ?? '').trim();

  if (!djRole && !adminRole && !clear) {
    return setHelp();
  }

  const changes: string[] = [];

  if (clear === 'dj' || (!clear && !djRole)) {
    const previous = deps.repo.getGuildSetting(guildId, 'dj_role_id');
    if (previous) {
      deps.repo.setGuildSetting(guildId, 'dj_role_id', '');
      changes.push('Cleared DJ role.');
    }
  } else if (djRole) {
    deps.repo.setGuildSetting(guildId, 'dj_role_id', djRole);
    changes.push(`DJ role → <@&${djRole}>`);
  }

  if (clear === 'admin' || (!clear && !adminRole)) {
    const previous = deps.repo.getGuildSetting(guildId, 'admin_role_id');
    if (previous) {
      deps.repo.setGuildSetting(guildId, 'admin_role_id', '');
      changes.push('Cleared Admin role.');
    }
  } else if (adminRole) {
    deps.repo.setGuildSetting(guildId, 'admin_role_id', adminRole);
    changes.push(`Admin role → <@&${adminRole}>`);
  }

  if (changes.length === 0) {
    return embedResponse(
      createEmbed({
        color: EMBED_COLORS.WARNING,
        title: '⚠️ No Role Changes',
        description: 'There are no roles configured that match your request.',
      }),
    );
  }

  deps.repo.logActivity(userId, 'info', 'bot', `Updated guild roles for ${guildId} via /set role`);
  return embedResponse(
    successEmbed('Roles Updated', undefined, [{ name: 'Changes', value: changes.join('\n'), inline: false }]),
  );
}

function handleSetFeature(
  userId: number,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
): InteractionResponse {
  const rawName = String(options.find((o) => o.name === 'name')?.value ?? '').trim();
  const enabledOption = options.find((o) => o.name === 'enabled')?.value;

  if (!(FEATURE_NAMES as readonly string[]).includes(rawName) || enabledOption === undefined) {
    return setHelp();
  }

  const name = rawName as (typeof FEATURE_NAMES)[number];
  const enabled = Boolean(enabledOption);
  deps.repo.setGuildSetting(guildId, `feature_${name}`, enabled ? '1' : '0');

  if (name === 'threads') {
    const binding = deps.repo.getGuildBinding(guildId);
    deps.repo.setGuildThreadConfig(guildId, {
      threadsEnabled: enabled,
      forumChannelIds: binding?.forumChannelIds ?? [],
    });
  }

  deps.repo.logActivity(
    userId,
    'info',
    'bot',
    `${enabled ? 'Enabled' : 'Disabled'} feature "${name}" for guild ${guildId} via /set`,
  );

  return embedResponse(
    successEmbed(
      `Feature ${enabled ? 'Enabled' : 'Disabled'}`,
      `**${FEATURE_LABELS[name]}** is now ${enabled ? '**enabled**' : '**disabled**'} for this server.`,
    ),
  );
}

function handleSetPrefix(
  userId: number,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
): InteractionResponse {
  const raw = String(options.find((o) => o.name === 'value')?.value ?? '').trim();
  const value = raw.slice(0, 16);

  if (!value) {
    deps.repo.setGuildSetting(guildId, 'prefix', '');
    deps.repo.logActivity(userId, 'info', 'bot', `Cleared command prefix for guild ${guildId} via /set`);
    return embedResponse(successEmbed('Prefix Cleared', 'This server no longer uses a custom command prefix.'));
  }

  deps.repo.setGuildSetting(guildId, 'prefix', value);
  deps.repo.logActivity(userId, 'info', 'bot', `Set command prefix to "${value}" for guild ${guildId} via /set`);

  return embedResponse(
    successEmbed(
      'Prefix Updated',
      `Custom command prefix is now \`${value}\`. Leave the value empty to reset to slash-commands-only mode.`,
    ),
  );
}

function handleSetView(userId: number, guildId: string, deps: AppDeps): InteractionResponse {
  const binding = deps.repo.getGuildBinding(guildId);
  const targets = deps.repo.getGuildCategoryTargets(guildId);
  const djRole = deps.repo.getGuildSetting(guildId, 'dj_role_id');
  const adminRole = deps.repo.getGuildSetting(guildId, 'admin_role_id');
  const prefix = deps.repo.getGuildSetting(guildId, 'prefix');
  const guildName = (binding?.name || '').trim() || 'this server';

  const channelLines = FEED_CATEGORIES.map((category) => {
    const target = targets.find((t) => t.category === category);
    if (!target || !target.channelId) {
      return `**${CATEGORY_LABELS[category]}:** Not configured`;
    }
    const thread = target.threadChannelId ? ` (threads: <#${target.threadChannelId}>)` : '';
    return `**${CATEGORY_LABELS[category]}:** <#${target.channelId}>${thread}`;
  });

  const featureLines = FEATURE_NAMES.map(
    (name) => `${deps.repo.getGuildSetting(guildId, `feature_${name}`) === '1' ? '✅' : '⬜'} ${FEATURE_LABELS[name]}`,
  );

  const forumLine = binding
    ? binding.threadsEnabled
      ? `Enabled${
          binding.forumChannelIds.length
            ? ` (forums: ${binding.forumChannelIds.map((id) => `<#${id}>`).join(', ')})`
            : ' (forum: per-category or env default)'
        }`
      : 'Disabled'
    : 'Disabled';

  deps.repo.logActivity(userId, 'info', 'bot', `Viewed guild config for ${guildId} via /set view`);

  return embedResponse(
    createEmbed({
      color: EMBED_COLORS.INFO,
      title: `⚙️ ${guildName} — Guild Configuration`,
      fields: [
        { name: '📨 Category Delivery', value: channelLines.join('\n'), inline: false },
        {
          name: '🎭 Roles',
          value: `**DJ:** ${djRole ? `<@&${djRole}>` : 'Not set'}\n**Admin:** ${adminRole ? `<@&${adminRole}>` : 'Not set'}`,
          inline: false,
        },
        { name: '⚙️ Features', value: featureLines.join('\n'), inline: false },
        { name: '🧵 Thread Delivery', value: forumLine, inline: false },
        { name: '🔤 Command Prefix', value: prefix ? `\`${prefix}\`` : 'Slash commands only', inline: false },
      ],
      footer: { text: `${appDisplayName(deps)} • /set view` },
    }),
  );
}

function handleSetReset(
  userId: number,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
): InteractionResponse {
  const rawTarget = String(options.find((o) => o.name === 'target')?.value ?? '').trim();

  if (!(RESET_TARGETS as readonly string[]).includes(rawTarget)) {
    return setHelp();
  }

  const details: string[] = [];

  if (rawTarget === 'channels' || rawTarget === 'all') {
    for (const category of FEED_CATEGORIES) {
      deps.repo.setGuildCategoryTarget(guildId, category, null, null);
    }
    details.push('Cleared all category delivery channels.');
  }

  if (rawTarget === 'roles' || rawTarget === 'all') {
    deps.repo.setGuildSetting(guildId, 'dj_role_id', '');
    deps.repo.setGuildSetting(guildId, 'admin_role_id', '');
    details.push('Cleared DJ and Admin roles.');
  }

  if (rawTarget === 'features' || rawTarget === 'all') {
    for (const name of FEATURE_NAMES) {
      deps.repo.setGuildSetting(guildId, `feature_${name}`, '');
    }
    details.push('Cleared all feature toggles.');
  }

  if (rawTarget === 'prefix' || rawTarget === 'all') {
    deps.repo.setGuildSetting(guildId, 'prefix', '');
    details.push('Cleared the custom command prefix.');
  }

  if (rawTarget === 'all') {
    deps.repo.setGuildThreadConfig(guildId, { threadsEnabled: false, forumChannelIds: [] });
    details.push('Disabled thread delivery.');
  }

  deps.repo.logActivity(userId, 'info', 'bot', `Reset "${rawTarget}" settings for guild ${guildId} via /set`);

  return embedResponse(
    successEmbed('Settings Reset', details.join('\n'), [
      {
        name: 'Reset Scope',
        value: rawTarget === 'all' ? 'Everything' : `\`${rawTarget}\``,
        inline: false,
      },
    ]),
  );
}
