import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { registerCommandMetadata } from '../../handlers/registry.js';

/**
 * Standard Command Template for HELIX Discord Bot.
 * Colocates command definition, subcommands/options, and execution handler.
 */
export const exampleCommandDef: ApplicationCommand = {
  name: 'example',
  description: 'Example slash command description (max 100 characters)',
  dm_permission: false, // Set false if command is server-only
  // default_member_permissions: '8', // Optional bitfield string (e.g. '8' for Administrator)
  options: [
    {
      name: 'action',
      description: 'Operation to perform',
      type: ApplicationCommandOptionType.STRING,
      required: true,
      choices: [
        { name: 'View status', value: 'view' },
        { name: 'Toggle feature', value: 'toggle' },
        { name: 'Reset settings', value: 'reset' },
      ],
    },
    {
      name: 'query',
      description: 'Search filter or name (supports autocomplete)',
      type: ApplicationCommandOptionType.STRING,
      required: false,
      autocomplete: true,
    },
    {
      name: 'count',
      description: 'Number of items (1 - 50)',
      type: ApplicationCommandOptionType.INTEGER,
      required: false,
      min_value: 1,
      max_value: 50,
    },
  ],
};

export async function handleExampleCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only', '❌')
      .description('This command can only be used inside a Discord server.')
      .respond(true);
  }

  // 1. Feature flag guardrail
  if (!deps.config.features.feedsEnabled) {
    return EmbedHandler.for(deps)
      .error()
      .title('Feature Disabled', '❌')
      .description('This command is currently disabled on this server.')
      .respond(true);
  }

  // 2. Extract options
  const options = interaction.data?.options as InteractionOption[] | undefined;
  const action = String(options?.find((o) => o.name === 'action')?.value ?? '');

  // 3. Command execution logic
  if (action === 'status') {
    return EmbedHandler.for(deps)
      .info()
      .title('Service Status', 'ℹ️')
      .field('State', 'Operational', true)
      .respond(true);
  }

  return EmbedHandler.for(deps)
    .success()
    .title('Success', '✅')
    .description('Command executed successfully.')
    .respond();
}

registerCommandMetadata({
  name: 'example',
  description: 'Example slash command description',
  category: 'utility',
  emoji: '🔧',
  usage: '/example <action> [query] [count]',
  examples: ['/example action:view', '/example action:toggle'],
});