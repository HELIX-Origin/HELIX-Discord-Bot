import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import { InteractionResponseType, type DiscordInteraction, type InteractionResponse } from '../utils/types.js';
import { getCommand, isCommandDisabled } from './registry.js';
import { EmbedHandler } from '../lib/embeds/builder.js';
import { loadAllCommands } from './loader.js';
import { handleTicketButton } from '../commands/admin/ticket.js';

export async function dispatchInteraction(
  interaction: DiscordInteraction,
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  await loadAllCommands();
  const guildId = interaction.guild_id ?? (interaction as unknown as { guildId?: string }).guildId;

  // Handle message component interactions (e.g. ticket open button)
  if (interaction.type === 3) {
    const customId = interaction.data?.custom_id?.toLowerCase() ?? '';
    if (customId === 'ticket_open') {
      if (isCommandDisabled(guildId, 'ticket', deps)) {
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'The ticket system is currently disabled in this server.',
            flags: 64,
          },
        };
      }
      return handleTicketButton(interaction, deps, rest);
    }
    return EmbedHandler.for(deps)
      .error()
      .title('Unknown Interaction')
      .description(`Unknown button: \`${customId}\``)
      .respond(true);
  }

  const commandName = (
    interaction.data?.name ||
    (interaction as unknown as { commandName?: string }).commandName ||
    ''
  ).toLowerCase();

  // Handle autocomplete interactions
  if (interaction.type === 4) {
    const cmd = getCommand(commandName);
    if (cmd?.autocomplete) {
      return cmd.autocomplete(interaction, deps);
    }
    return {
      type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
      data: { choices: [] },
    };
  }

  const cmd = getCommand(commandName);
  if (!cmd) {
    return EmbedHandler.for(deps)
      .error()
      .title('Unknown Command')
      .description(`Unknown command: \`/${commandName}\``)
      .respond(true);
  }

  if (isCommandDisabled(guildId, commandName, deps)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Command \`/${commandName}\` is disabled in this server.`,
        flags: 64,
      },
    };
  }

  return cmd.execute(interaction, deps, rest);
}
