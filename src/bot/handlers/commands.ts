import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import {
  InteractionResponseType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../utils/types.js';
import { getEnabledCommands, getCommand, isCommandDisabled } from './registry.js';
import { EmbedHandler } from '../lib/embeds/builder.js';
import { loadAllCommands } from './loader.js';

export interface CommandHandler {
  readonly commands: ApplicationCommand[];
  readonly autocompleteHandlers: Map<
    string,
    (interaction: DiscordInteraction, deps: AppDeps) => Promise<InteractionResponse>
  >;
}

export function createCommandHandler(deps: AppDeps): CommandHandler {
  return { commands: getEnabledCommands(deps), autocompleteHandlers: new Map() };
}

export async function dispatchInteraction(
  interaction: DiscordInteraction,
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  await loadAllCommands();
  const commandName = (interaction.data?.name ?? '').toLowerCase();

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

  if (isCommandDisabled(interaction.guild_id, commandName, deps)) {
    const isGuildDisabled = Boolean(
      interaction.guild_id && deps.repo.getGuildSetting(interaction.guild_id, `cmd_disabled_${commandName}`) === '1',
    );
    const desc = isGuildDisabled
      ? `The command \`/${commandName}\` is disabled in this server.`
      : `The command \`/${commandName}\` is currently disabled on this bot.`;

    return EmbedHandler.for(deps).error().title('Command Disabled').description(desc).respond(true);
  }

  return cmd.execute(interaction, deps, rest);
}
