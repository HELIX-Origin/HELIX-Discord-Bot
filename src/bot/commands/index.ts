import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import {
  InteractionResponseType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../types.js';
import { aboutCommandDef, handleAboutCommand } from './about.js';
import { feedCommandDef, handleFeedCommand } from './feed.js';
import { handleHelpCommand, helpCommandDef } from './help.js';
import { handleStatsCommand, statsCommandDef } from './stats.js';
import {
  gifCommandDef,
  handleGifCommand,
  handleGifAutocomplete,
  actionCommandDefs,
  handleActionCommand,
} from './gif.js';

export { handleGifAutocomplete };

export function getEnabledCommands(deps: AppDeps): ApplicationCommand[] {
  const f = deps.config.features;
  const cmds: ApplicationCommand[] = [aboutCommandDef, statsCommandDef];
  if (f.feedsEnabled) cmds.push(feedCommandDef);
  if (f.gifsEnabled && deps.config.klipyApiKey) cmds.push(gifCommandDef, ...actionCommandDefs);
  // Phase 12: Administration commands gated by ADMINISTRATION_ENABLED
  // Phase 14: Music commands gated by LAVA_ENABLED
  cmds.push(helpCommandDef);
  return cmds;
}

export async function dispatchInteraction(
  interaction: DiscordInteraction,
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const commandName = interaction.data?.name ?? '';
  const enabledCmds = getEnabledCommands(deps);
  const enabledNames = new Set(enabledCmds.map((c) => c.name));

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
      return handleHelpCommand(interaction, enabledCmds, deps);
    case 'gif':
      return handleGifCommand(interaction, deps, rest);
    default:
      if (actionCommandDefs.some((c) => c.name === commandName)) {
        return handleActionCommand(interaction, deps, commandName);
      }
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: 64,
          content: `❌ Unknown command: /${commandName}`,
        },
      };
  }
}
