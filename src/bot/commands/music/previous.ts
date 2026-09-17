import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { type ApplicationCommand, type DiscordInteraction, type InteractionResponse } from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const previousCommandDef: ApplicationCommand = {
  name: 'previous',
  description: 'Go back to the previously played track',
  options: [],
};

export const backCommandDef: ApplicationCommand = {
  name: 'back',
  description: 'Go back to the previously played track',
  options: [],
};

export async function handlePreviousCommand(
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

  const prev = await manager.previous(guildId);
  if (!prev) {
    return EmbedHandler.for(deps)
      .error()
      .title('No Previous Track')
      .description('No previous track found in history.')
      .respond(true);
  }
  return EmbedHandler.for(deps)
    .primary()
    .title('Previous Track', '⏮️')
    .description(`Now playing: **${prev.track.title}**`)
    .respond();
}

export const previousCommand: BotCommand = {
  def: previousCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handlePreviousCommand,
  aliases: ['back'],
};
