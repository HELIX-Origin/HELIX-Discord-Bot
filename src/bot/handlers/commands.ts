import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import { InteractionResponseType, type DiscordInteraction, type InteractionResponse } from '../utils/types.js';
import { getCommand } from './registry.js';
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
      if (guildId && deps.repo.getGuildSetting(guildId, 'feature_ticket') === '0') {
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'The ticket system is currently disabled.',
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

  const cmd = getCommand(commandName);

  // Handle autocomplete interactions
  if (interaction.type === 4) {
    if (cmd?.autocomplete) {
      return cmd.autocomplete(interaction, deps);
    }
    return {
      type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
      data: { choices: [] },
    };
  }

  const DASHBOARD_CONFIGURED_COMMANDS = ['rss', 'reddit', 'youtube', 'twitch', 'free-games', 'welcome', 'ticket', 'set', 'server'];

  if (DASHBOARD_CONFIGURED_COMMANDS.includes(commandName)) {
    return EmbedHandler.for(deps)
      .info()
      .title('Configured via Web Dashboard', '🖥️')
      .description(
        `**/${commandName}** is configured exclusively through the Web Dashboard.\n\nPlease log in to the dashboard to configure feeds, channels, stream alerts, welcome announcements, support tickets, and server settings with live previews and full options.`,
      )
      .respond(true);
  }

  if (!cmd) {
    return EmbedHandler.for(deps)
      .error()
      .title('Unknown Command')
      .description(`Unknown command: \`/${commandName}\``)
      .respond(true);
  }

  return cmd.execute(interaction, deps, rest);
}
