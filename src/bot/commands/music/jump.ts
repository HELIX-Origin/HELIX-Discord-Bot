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
import { ensurePlayer } from '../../lib/music/utils.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const jumpOptions: ApplicationCommandOption[] = [
  {
    name: 'position',
    description: 'Track position in queue (1-indexed)',
    type: ApplicationCommandOptionType.INTEGER,
    required: true,
  },
];

export const jumpCommandDef: ApplicationCommand = {
  name: 'jump',
  description: 'Jump to a specific track in the queue',
  options: jumpOptions,
};

export async function handleJumpCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('Music commands can only be used in a server.')
      .respond(true);
  }
  if (!deps.config.features.lavaEnabled) {
    return EmbedHandler.for(deps)
      .error()
      .title('Music Disabled')
      .description('Music features are disabled.')
      .respond(true);
  }
  const manager = deps.lavaManager ?? null;
  if (!manager || !manager.isConnected()) {
    return EmbedHandler.for(deps)
      .error()
      .title('Not Connected')
      .description('Not connected to the Lavalink server.')
      .respond(true);
  }

  const error = await ensurePlayer(interaction, deps, manager);
  if (error) {
    return EmbedHandler.for(deps).error().title('Voice Channel Required').description(error).respond(true);
  }

  const player = await manager.getPlayer(guildId);
  if (!player?.current) {
    return EmbedHandler.for(deps)
      .error()
      .title('Nothing Playing')
      .description('Nothing is currently playing.')
      .respond(true);
  }
  if (!player.queue.length) {
    return EmbedHandler.for(deps).error().title('Queue Empty').description('The queue is empty.').respond(true);
  }

  const options = interaction.data?.options as InteractionOption[] | undefined;
  const position = options?.find((o) => o.name === 'position')?.value as number;
  if (!position || position < 1 || position > player.queue.length) {
    return EmbedHandler.for(deps)
      .error()
      .title('Invalid Position')
      .description(`Position must be between 1 and ${player.queue.length}.`)
      .respond(true);
  }

  const [jumped] = player.queue.splice(position - 1, 1);
  player.queue.unshift(jumped);
  await manager.stop(guildId);
  return EmbedHandler.for(deps)
    .primary()
    .title('Jumped Track', '⏭️')
    .description(`Jumped to track #${position}: **[${jumped.track.title}](${jumped.track.uri})**.`)
    .respond();
}

export const jumpCommand: BotCommand = {
  def: jumpCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handleJumpCommand,
};
