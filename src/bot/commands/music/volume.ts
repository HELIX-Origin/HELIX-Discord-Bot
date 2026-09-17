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
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const volumeOptions: ApplicationCommandOption[] = [
  {
    name: 'level',
    description: 'Volume level (0-200)',
    type: ApplicationCommandOptionType.INTEGER,
    required: false,
    min_value: 0,
    max_value: 200,
  },
];

export const volumeCommandDef: ApplicationCommand = {
  name: 'volume',
  description: 'Set or view volume',
  options: volumeOptions,
};

export async function handleVolumeCommand(
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
  if (!player) {
    return EmbedHandler.for(deps)
      .error()
      .title('No Player')
      .description('No active player found for this server.')
      .respond(true);
  }

  const options = interaction.data?.options as InteractionOption[] | undefined;
  const level = options?.find((o) => o.name === 'level')?.value as number | undefined;

  if (level === undefined) {
    return EmbedHandler.for(deps)
      .primary()
      .title('Volume', '🔊')
      .description(`Current volume: **${player.volume}%**`)
      .respond();
  }
  if (level < 0 || level > 200) {
    return EmbedHandler.for(deps)
      .error()
      .title('Invalid Volume')
      .description('Volume must be between 0 and 200.')
      .respond(true);
  }
  await manager.setVolume(guildId, level);
  return EmbedHandler.for(deps)
    .success()
    .title('Volume Updated', '🔊')
    .description(`Volume set to **${level}%**.`)
    .respond();
}

export const volumeCommand: BotCommand = {
  def: volumeCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handleVolumeCommand,
};
