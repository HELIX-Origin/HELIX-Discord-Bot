import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type ApplicationCommandOption,
  type DiscordInteraction,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';
import { PermissionFlagsBits } from 'discord.js';

export const serverOptions: ApplicationCommandOption[] = [
  {
    name: 'export',
    description: 'Export guild configuration as JSON',
    type: ApplicationCommandOptionType.SUB_COMMAND,
  },
  {
    name: 'import',
    description: 'Import guild configuration from JSON',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'data',
        description: 'The JSON configuration string to import',
        type: ApplicationCommandOptionType.STRING,
        required: true,
      },
    ],
  },
  {
    name: 'command',
    description: 'Enable or disable a specific bot command in this guild',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'name',
        description: 'Command name e.g. "free-games", "stats"',
        type: ApplicationCommandOptionType.STRING,
        required: true,
      },
      {
        name: 'enabled',
        description: 'Whether the command should be enabled (true/false)',
        type: ApplicationCommandOptionType.BOOLEAN,
        required: true,
      },
    ],
  },
];

export const serverCommandDef: ApplicationCommand = {
  name: 'server',
  description: 'Manage guild configurations and command toggles',
  default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  dm_permission: false,
  options: serverOptions,
};

export async function handleServerCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('Server configuration commands can only be used inside a Discord server.')
      .respond(true);
  }

  const subOptions = interaction.data?.options ?? [];
  const sub = subOptions[0];
  const subName = sub?.name;

  if (subName === 'export') {
    const binding = deps.repo.getGuildBinding(guildId);
    const allFeeds = deps.repo.listFeedsForAllUsers();
    const feeds = allFeeds.filter((f) => f.guildId === guildId);

    const settingKeys = ['admin_role_id', 'prefix', 'feature_feeds', 'feature_streamalerts', 'mod_log_channel_id'];

    const settings: Record<string, string> = {};
    for (const k of settingKeys) {
      const v = deps.repo.getGuildSetting(guildId, k);
      if (v !== null) settings[k] = v;
    }

    const exportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      guildId,
      guildName: binding?.name ?? 'Unknown',
      settings,
      feeds: feeds.map((f) => ({
        url: f.url,
        name: f.name,
        channelId: f.channelId,
        feedType: f.feedType,
      })),
    };

    const json = JSON.stringify(exportPayload, null, 2);
    // Truncate for Discord limit if needed
    const truncated = json.length > 3900 ? `${json.slice(0, 3850)}\n...[truncated]` : json;

    return EmbedHandler.for(deps)
      .success()
      .title('Server Configuration Export', '📦')
      .description(`\`\`\`json\n${truncated}\n\`\`\``)
      .footer('Keep your export data safe.')
      .respond(true);
  }

  if (subName === 'import') {
    const rawData = String(subOptions.find((o) => o.name === 'data')?.value ?? '').trim();
    if (!rawData) {
      return EmbedHandler.for(deps)
        .error()
        .title('Missing Data')
        .description('Please provide a valid JSON string.')
        .respond(true);
    }

    try {
      const parsed = JSON.parse(rawData) as { settings?: Record<string, string> };
      if (parsed.settings && typeof parsed.settings === 'object') {
        for (const [k, v] of Object.entries(parsed.settings)) {
          deps.repo.setGuildSetting(guildId, k, String(v));
        }
      }
      return EmbedHandler.for(deps)
        .success()
        .title('Configuration Imported', '📥')
        .description('Successfully imported guild settings.')
        .respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Invalid JSON')
        .description(`Failed to parse configuration: ${(err as Error).message}`)
        .respond(true);
    }
  }

  if (subName === 'command') {
    const cmdName = String(subOptions.find((o) => o.name === 'name')?.value ?? '')
      .trim()
      .toLowerCase()
      .replace(/^\/+/, '');
    const enabled = Boolean(subOptions.find((o) => o.name === 'enabled')?.value);

    if (!cmdName) {
      return EmbedHandler.for(deps)
        .error()
        .title('Missing Command Name')
        .description('Please specify a command name.')
        .respond(true);
    }

    const key = `cmd_disabled_${cmdName}`;
    deps.repo.setGuildSetting(guildId, key, enabled ? '0' : '1');

    return EmbedHandler.for(deps)
      .success()
      .title('Command Toggled', '⚙️')
      .description(`Command \`/${cmdName}\` has been **${enabled ? 'enabled' : 'disabled'}** for this server.`)
      .respond();
  }

  return EmbedHandler.for(deps).error().title('Invalid Action').description('Unknown server subcommand.').respond(true);
}

registerCommandMetadata({
  name: 'server',
  description: 'Manage guild configurations and command toggles',
  category: 'admin',
  emoji: '⚙️',
  usage: '/server <export|import|command>',
  options: serverOptions,
  subcommands: [
    { name: 'export', description: 'Export guild configuration as JSON' },
    { name: 'import', description: 'Import guild configuration from JSON' },
    { name: 'command', description: 'Enable or disable a command in this guild' },
  ],
  examples: ['/server export', '/server command name:stats enabled:false'],
});

export const serverCommand: BotCommand = {
  def: serverCommandDef,
  category: 'admin',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleServerCommand,
};
