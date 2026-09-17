import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { type ApplicationCommand, type DiscordInteraction, type InteractionResponse } from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const skipCommandDef: ApplicationCommand = {
  name: 'skip',
  description: 'Skip the current track',
  options: [],
};

export const nextCommandDef: ApplicationCommand = {
  name: 'next',
  description: 'Skip the current track',
  options: [],
};

export async function handleSkipCommand(
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
  if (!player?.current) {
    return EmbedHandler.for(deps)
      .error()
      .title('Nothing Playing')
      .description('There is no track currently playing to skip.')
      .respond(true);
  }
  await manager.stop(guildId);
  return EmbedHandler.for(deps).primary().title('Skipped', '⏭️').description('Skipped to the next track.').respond();
}

export const skipCommand: BotCommand = {
  def: skipCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handleSkipCommand,
  aliases: ['next'],
};
