import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import {
  InteractionResponseType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../utils/types.js';
import { aboutCommandDef, handleAboutCommand } from '../commands/utility/about.js';
import { feedCommandDef, handleFeedCommand } from '../commands/feeds/feed.js';
import { handleHelpCommand, helpCommandDef } from '../commands/utility/help.js';
import { handleStatsCommand, statsCommandDef } from '../commands/utility/stats.js';
import { gifCommandDef, handleGifCommand } from '../commands/entertainment/gif.js';
import { setCommandDef, handleSetCommand } from '../commands/admin/set.js';
import { welcomeCommandDef, handleWelcomeCommand } from '../commands/admin/welcome.js';
import { ticketCommandDef, handleTicketCommand } from '../commands/admin/ticket.js';
import { musicCommandDefs, handleMusicCommand } from '../commands/music/music.js';

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
  if (f.administrationEnabled) commands.push(setCommandDef, welcomeCommandDef, ticketCommandDef);
  if (f.lavaEnabled) commands.push(...musicCommandDefs);

  commands.push(helpCommandDef);

  const autocompleteHandlers = new Map<
    string,
    (interaction: DiscordInteraction, deps: AppDeps) => Promise<InteractionResponse>
  >();

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
    case 'welcome':
      return handleWelcomeCommand(interaction, deps, rest);
    case 'ticket':
      return handleTicketCommand(interaction, deps, rest);
    case 'play':
    case 'queue':
    case 'skip':
    case 'next':
    case 'previous':
    case 'jump':
    case 'leave':
    case 'volume':
    case 'equalizer':
    case 'nowplaying':
    case 'np':
    case 'pause':
    case 'resume':
    case 'stop':
    case 'seek':
    case 'shuffle':
    case 'loop':
      return handleMusicCommand(interaction, deps, rest);
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
