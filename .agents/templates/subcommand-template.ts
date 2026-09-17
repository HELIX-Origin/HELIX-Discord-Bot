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
 * Subcommand / Subcommand Group Template for HELIX Discord Bot.
 * Colocates subcommands directly within the command definition file.
 */
export const adminCommandDef: ApplicationCommand = {
  name: 'admin',
  description: 'Guild administration, moderation, and role management',
  default_member_permissions: '8', // Administrator
  dm_permission: false,
  options: [
    {
      name: 'kick',
      description: 'Kick a member from the server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'user',
          description: 'The member to kick',
          type: ApplicationCommandOptionType.USER,
          required: true,
        },
        {
          name: 'reason',
          description: 'Reason for the kick',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
    {
      name: 'ban',
      description: 'Ban a member from the server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'user',
          description: 'The member to ban',
          type: ApplicationCommandOptionType.USER,
          required: true,
        },
        {
          name: 'reason',
          description: 'Reason for the ban',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
  ],
};

export async function handleAdminCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps).error().title('Server Only', '❌').description('Server only.').respond(true);
  }

  if (!deps.config.features.administrationEnabled) {
    return EmbedHandler.for(deps).error().title('Administration Disabled', '❌').description('Admin features are disabled.').respond(true);
  }

  const options = interaction.data?.options as InteractionOption[] | undefined;
  const subCommand = options?.[0];

  switch (subCommand?.name) {
    case 'kick': {
      return EmbedHandler.for(deps).success().title('Member Kicked', '👢').description('Member was kicked.').respond(true);
    }
    case 'ban': {
      return EmbedHandler.for(deps).success().title('Member Banned', '🔨').description('Member was banned.').respond(true);
    }
    default:
      return EmbedHandler.for(deps).error().title('Unknown Subcommand', '❌').description('Subcommand not found.').respond(true);
  }
}

registerCommandMetadata({
  name: 'admin',
  description: 'Guild administration, moderation, and role management',
  category: 'admin',
  emoji: '🛡️',
  usage: '/admin <subcommand>',
  subcommands: [
    { name: 'kick', description: 'Kick a member from the server' },
    { name: 'ban', description: 'Ban a member from the server' },
  ],
});
