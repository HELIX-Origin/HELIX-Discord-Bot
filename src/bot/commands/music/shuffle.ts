import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { type ApplicationCommand, type DiscordInteraction, type InteractionResponse } from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const shuffleCommandDef: ApplicationCommand = {
  name: 'shuffle',
  description: 'Shuffle the queue',
  options: [],
};

export async function handleShuffleCommand(
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

  const player = await manager.getPlayer(guildId);
  if (!player || !player.queue.length) {
    return EmbedHandler.for(deps).error().title('Queue Empty').description('The queue is empty.').respond(true);
  }

  for (let i = player.queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
  }

  return EmbedHandler.for(deps)
    .primary()
    .title('Shuffled', '🔀')
    .description(`Shuffled **${player.queue.length}** tracks in the queue.`)
    .respond();
}

export const shuffleCommand: BotCommand = {
  def: shuffleCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handleShuffleCommand,
};
