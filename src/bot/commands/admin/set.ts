import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type ApplicationCommandOption,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';

export const SET_ACTIONS = ['role', 'feature', 'prefix', 'view', 'reset'] as const;
export type SetAction = (typeof SET_ACTIONS)[number];

export const SET_FEATURE_NAMES = ['feeds', 'streamalerts', 'music', 'gifs'] as const;
export const SET_RESET_TARGETS = ['roles', 'features', 'prefix', 'all'] as const;

export const setOptions: ApplicationCommandOption[] = [
  {
    name: 'action',
    description: 'What to configure',
    type: ApplicationCommandOptionType.STRING,
    required: true,
    choices: [
      { name: 'Configure roles', value: 'role' },
      { name: 'Enable/disable a feature', value: 'feature' },
      { name: 'Set the command prefix', value: 'prefix' },
      { name: 'View current configuration', value: 'view' },
      { name: 'Reset a setting', value: 'reset' },
    ],
  },
  {
    name: 'dj',
    description: 'Set the DJ role for music commands (role)',
    type: ApplicationCommandOptionType.ROLE,
    required: false,
  },
  {
    name: 'admin',
    description: 'Set a role that can manage feeds and bot settings (role)',
    type: ApplicationCommandOptionType.ROLE,
    required: false,
  },
  {
    name: 'clear',
    description: 'Remove a configured role (role)',
    type: ApplicationCommandOptionType.STRING,
    required: false,
    choices: [
      { name: 'DJ Role', value: 'dj' },
      { name: 'Admin Role', value: 'admin' },
    ],
  },
  {
    name: 'feature',
    description: 'Feature to toggle (feature)',
    type: ApplicationCommandOptionType.STRING,
    required: false,
    choices: [
      { name: 'Feeds (RSS/Reddit/Free Games)', value: 'feeds' },
      { name: 'Stream Alerts (YouTube/Twitch)', value: 'streamalerts' },
      { name: 'Music (Lavalink)', value: 'music' },
      { name: 'GIF Commands', value: 'gifs' },
    ],
  },
  {
    name: 'enabled',
    description: 'Enable or disable the feature (feature)',
    type: ApplicationCommandOptionType.BOOLEAN,
    required: false,
  },
  {
    name: 'value',
    description: 'Prefix string e.g. "!", "?", "." — empty to reset (prefix)',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
  {
    name: 'reset_target',
    description: 'What to reset (reset)',
    type: ApplicationCommandOptionType.STRING,
    required: false,
    choices: [
      { name: 'All Roles', value: 'roles' },
      { name: 'All Features', value: 'features' },
      { name: 'Prefix', value: 'prefix' },
      { name: 'Everything', value: 'all' },
    ],
  },
];

export const setCommandDef: ApplicationCommand = {
  name: 'set',
  description: 'Configure guild settings (roles, permissions, features)',
  default_member_permissions: '8',
  dm_permission: false,
  options: setOptions,
};

const FEATURE_LABELS: Record<(typeof SET_FEATURE_NAMES)[number], string> = {
  feeds: 'Feeds (RSS/Reddit/Free Games)',
  streamalerts: 'Stream Alerts (YouTube/Twitch)',
  music: 'Music (Lavalink)',
  gifs: 'GIF Commands',
};

function optionRaw(options: InteractionOption[], name: string): unknown {
  return options.find((o) => o.name === name)?.value;
}

function optionValue(options: InteractionOption[], name: string): string {
  return String(optionRaw(options, name) ?? '').trim();
}

function usageEmbed(deps: AppDeps): InteractionResponse {
  return EmbedHandler.for(deps)
    .info()
    .title('Set Command Usage', '⚙️')
    .description('Use `/set` with one of the actions below.')
    .field('🎭 role', '`/set action:role dj:@MusicRole` · `admin:@Staff` · `clear:dj`', false)
    .field('⚙️ feature', '`/set action:feature feature:music enabled:True`', false)
    .field('🔤 prefix', '`/set action:prefix value:!`', false)
    .field('👁️ view', '`/set action:view`', false)
    .field('♻️ reset', '`/set action:reset reset_target:roles`', false)
    .respond();
}

export async function handleSetCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Settings Only')
      .description('`/set` can only be used inside a Discord server (guild).')
      .respond(true);
  }

  const user = deps.repo.getOrCreateGuildUser(guildId);
  const options = interaction.data?.options ?? [];

  switch (optionValue(options, 'action')) {
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
      return usageEmbed(deps);
  }
}

function handleSetRole(
  userId: number,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
): InteractionResponse {
  const djRole = optionValue(options, 'dj');
  const adminRole = optionValue(options, 'admin');
  const clear = optionValue(options, 'clear');

  if (!djRole && !adminRole && !clear) {
    return usageEmbed(deps);
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
    return EmbedHandler.for(deps)
      .warning()
      .title('No Role Changes', '⚠️')
      .description('There are no roles configured that match your request.')
      .respond();
  }

  deps.repo.logActivity(userId, 'info', 'bot', `Updated guild roles for ${guildId} via /set role`);
  return EmbedHandler.for(deps).success().title('Roles Updated').section('Changes', changes.join('\n')).respond();
}

function handleSetFeature(
  userId: number,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
): InteractionResponse {
  const rawName = optionValue(options, 'feature');
  const enabledOption = optionRaw(options, 'enabled');

  if (!(SET_FEATURE_NAMES as readonly string[]).includes(rawName) || enabledOption === undefined) {
    return usageEmbed(deps);
  }

  const name = rawName as (typeof SET_FEATURE_NAMES)[number];
  const enabled = Boolean(enabledOption);
  deps.repo.setGuildSetting(guildId, `feature_${name}`, enabled ? '1' : '0');

  deps.repo.logActivity(
    userId,
    'info',
    'bot',
    `${enabled ? 'Enabled' : 'Disabled'} feature "${name}" for guild ${guildId} via /set`,
  );

  return EmbedHandler.for(deps)
    .success()
    .title(`Feature ${enabled ? 'Enabled' : 'Disabled'}`)
    .description(`**${FEATURE_LABELS[name]}** is now ${enabled ? '**enabled**' : '**disabled**'} for this server.`)
    .respond();
}

function handleSetPrefix(
  userId: number,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
): InteractionResponse {
  const value = optionValue(options, 'value').slice(0, 16);

  if (!value) {
    deps.repo.setGuildSetting(guildId, 'prefix', '');
    deps.repo.logActivity(userId, 'info', 'bot', `Cleared command prefix for guild ${guildId} via /set`);
    return EmbedHandler.for(deps)
      .success()
      .title('Prefix Cleared')
      .description('This server no longer uses a custom command prefix.')
      .respond();
  }

  deps.repo.setGuildSetting(guildId, 'prefix', value);
  deps.repo.logActivity(userId, 'info', 'bot', `Set command prefix to "${value}" for guild ${guildId} via /set`);

  return EmbedHandler.for(deps)
    .success()
    .title('Prefix Updated')
    .description(
      `Custom command prefix is now \`${value}\`. Leave the value empty to reset to slash-commands-only mode.`,
    )
    .respond();
}

function handleSetView(userId: number, guildId: string, deps: AppDeps): InteractionResponse {
  const binding = deps.repo.getGuildBinding(guildId);
  const djRole = deps.repo.getGuildSetting(guildId, 'dj_role_id');
  const adminRole = deps.repo.getGuildSetting(guildId, 'admin_role_id');
  const prefix = deps.repo.getGuildSetting(guildId, 'prefix');
  const guildName = (binding?.name || '').trim() || 'this server';

  const featureLines = SET_FEATURE_NAMES.map(
    (name) => `${deps.repo.getGuildSetting(guildId, `feature_${name}`) === '1' ? '✅' : '⬜'} ${FEATURE_LABELS[name]}`,
  );

  deps.repo.logActivity(userId, 'info', 'bot', `Viewed guild config for ${guildId} via /set view`);

  return EmbedHandler.for(deps)
    .info()
    .title(`${guildName} — Guild Configuration`, '⚙️')
    .section(
      '🎭 Roles',
      `**DJ:** ${djRole ? `<@&${djRole}>` : 'Not set'}\n**Admin:** ${adminRole ? `<@&${adminRole}>` : 'Not set'}`,
    )
    .section('⚙️ Features', featureLines.join('\n'))
    .section('🔤 Command Prefix', prefix ? `\`${prefix}\`` : 'Slash commands only')
    .footer('Guild Configuration')
    .respond();
}

function handleSetReset(
  userId: number,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
): InteractionResponse {
  const rawTarget = optionValue(options, 'reset_target');

  if (!(SET_RESET_TARGETS as readonly string[]).includes(rawTarget)) {
    return usageEmbed(deps);
  }

  const details: string[] = [];

  if (rawTarget === 'roles' || rawTarget === 'all') {
    deps.repo.setGuildSetting(guildId, 'dj_role_id', '');
    deps.repo.setGuildSetting(guildId, 'admin_role_id', '');
    details.push('Cleared DJ and Admin roles.');
  }

  if (rawTarget === 'features' || rawTarget === 'all') {
    for (const name of SET_FEATURE_NAMES) {
      deps.repo.setGuildSetting(guildId, `feature_${name}`, '');
    }
    details.push('Cleared all feature toggles.');
  }

  if (rawTarget === 'prefix' || rawTarget === 'all') {
    deps.repo.setGuildSetting(guildId, 'prefix', '');
    details.push('Cleared the custom command prefix.');
  }

  deps.repo.logActivity(userId, 'info', 'bot', `Reset "${rawTarget}" settings for guild ${guildId} via /set`);

  return EmbedHandler.for(deps)
    .success()
    .title('Settings Reset')
    .description(details.join('\n'))
    .section('Reset Scope', rawTarget === 'all' ? 'Everything' : `\`${rawTarget}\``)
    .respond();
}

registerCommandMetadata({
  name: 'set',
  description: 'Configure guild settings (roles, permissions, features)',
  category: 'admin',
  emoji: '🛡️',
  usage: '/set <action> [options]',
  options: [
    {
      name: 'action',
      description: 'What to configure',
      type: 3,
      required: true,
      choices: [
        { name: 'Configure roles', value: 'role' },
        { name: 'Enable/disable a feature', value: 'feature' },
        { name: 'Set the command prefix', value: 'prefix' },
        { name: 'View current configuration', value: 'view' },
        { name: 'Reset a setting', value: 'reset' },
      ],
    },
    { name: 'dj', description: 'Set the DJ role for music commands (role)', type: 8, required: false },
    {
      name: 'admin',
      description: 'Set a role that can manage feeds and bot settings (role)',
      type: 8,
      required: false,
    },
    {
      name: 'clear',
      description: 'Remove a configured role (role)',
      type: 3,
      required: false,
      choices: [
        { name: 'DJ Role', value: 'dj' },
        { name: 'Admin Role', value: 'admin' },
      ],
    },
    {
      name: 'feature',
      description: 'Feature to toggle (feature)',
      type: 3,
      required: false,
      choices: [
        { name: 'Feeds (RSS/Reddit/Free Games)', value: 'feeds' },
        { name: 'Stream Alerts (YouTube/Twitch)', value: 'streamalerts' },
        { name: 'Music (Lavalink)', value: 'music' },
        { name: 'GIF Commands', value: 'gifs' },
      ],
    },
    { name: 'enabled', description: 'Enable or disable the feature (feature)', type: 5, required: false },
    {
      name: 'value',
      description: 'Prefix string e.g. "!", "?", "." — empty to reset (prefix)',
      type: 3,
      required: false,
    },
    {
      name: 'reset_target',
      description: 'What to reset (reset)',
      type: 3,
      required: false,
      choices: [
        { name: 'All Roles', value: 'roles' },
        { name: 'All Features', value: 'features' },
        { name: 'Prefix', value: 'prefix' },
        { name: 'Everything', value: 'all' },
      ],
    },
  ],
  examples: [
    '/set action:role dj:@MusicRole',
    '/set action:feature feature:music enabled:True',
    '/set action:prefix value:!',
    '/set action:view',
    '/set action:reset reset_target:roles',
  ],
});

export const setCommand: BotCommand = {
  def: setCommandDef,
  category: 'admin',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleSetCommand,
};
