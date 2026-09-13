import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import {
  InteractionResponseType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../types.js';
import { aboutCommandDef, handleAboutCommand } from '../commands/about.js';
import { feedCommandDef, handleFeedCommand } from '../commands/feed.js';
import { handleHelpCommand, helpCommandDef } from '../commands/help.js';
import { handleStatsCommand, statsCommandDef } from '../commands/stats.js';
import { gifCommandDef, handleGifCommand, handleGifAutocomplete } from '../commands/gif.js';
import { setCommandDef, handleSetCommand } from '../commands/set.js';

export interface CommandHandler {
  readonly commands: ApplicationCommand[];
  readonly autocompleteHandlers: Map<
    string,
    (interaction: DiscordInteraction, deps: AppDeps) => Promise<InteractionResponse>
  >;
}

export function createCommandHandler(deps: AppDeps): CommandHandler {
  const f = deps.config.features;
  const commands: ApplicationCommand[] = [aboutCommandDef, statsCommandDef];
  if (f.feedsEnabled) commands.push(feedCommandDef);
  if (f.gifsEnabled && deps.config.klipyApiKey) commands.push(gifCommandDef);
  if (f.administrationEnabled) commands.push(setCommandDef);

  commands.push(helpCommandDef);

  const autocompleteHandlers = new Map<
    string,
    (interaction: DiscordInteraction, deps: AppDeps) => Promise<InteractionResponse>
  >();
  if (f.gifsEnabled && deps.config.klipyApiKey) {
    autocompleteHandlers.set('gif', handleGifAutocomplete);
  }

  return { commands, autocompleteHandlers };
}

export async function dispatchInteraction(
  interaction: DiscordInteraction,
  deps: AppDeps,
  rest: DiscordRestClient,
  handler: CommandHandler,
): Promise<InteractionResponse> {
  const commandName = interaction.data?.name ?? '';

  if (interaction.type === 4) {
    const autocompleteHandler = handler.autocompleteHandlers.get(commandName);
    if (autocompleteHandler) {
      return autocompleteHandler(interaction, deps);
    }
    return {
      type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
      data: { choices: [] },
    };
  }

  const enabledNames = new Set(handler.commands.map((c) => c.name));

  if (!enabledNames.has(commandName)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: 64,
        content: `❌ Unknown command: /${commandName}`,
      },
    };
  }

  switch (commandName) {
    case 'feed':
      return handleFeedCommand(interaction, deps, rest);
    case 'stats':
      return handleStatsCommand(interaction, deps);
    case 'about':
      return handleAboutCommand(interaction, deps);
    case 'help':
      return handleHelpCommand(interaction, handler.commands, deps);
    case 'gif':
      return handleGifCommand(interaction, deps, rest);
    case 'set':
      return handleSetCommand(interaction, deps, rest);
    default:
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: 64,
          content: `❌ Unknown command: /${commandName}`,
        },
      };
  }
}
