import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { type ApplicationCommand, type DiscordInteraction, type InteractionResponse } from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const pauseCommandDef: ApplicationCommand = {
  name: 'pause',
  description: 'Pause playback',
  options: [],
};

export async function handlePauseCommand(
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
  if (!player || !player.current || player.paused) {
    return EmbedHandler.for(deps)
      .error()
      .title('Cannot Pause')
      .description('There is nothing currently playing to pause.')
      .respond(true);
  }
  await manager.pause(guildId, true);
  return EmbedHandler.for(deps).primary().title('Paused', '⏸️').description('Playback has been paused.').respond();
}

export const pauseCommand: BotCommand = {
  def: pauseCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handlePauseCommand,
};
