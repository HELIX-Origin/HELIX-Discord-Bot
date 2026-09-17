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
import { ensurePlayer, formatDuration } from '../../lib/music/utils.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const seekOptions: ApplicationCommandOption[] = [
  {
    name: 'position',
    description: 'Position in milliseconds',
    type: ApplicationCommandOptionType.INTEGER,
    required: true,
    min_value: 0,
  },
];

export const seekCommandDef: ApplicationCommand = {
  name: 'seek',
  description: 'Seek to position in current track',
  options: seekOptions,
};

export async function handleSeekCommand(
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

  const options = interaction.data?.options as InteractionOption[] | undefined;
  const position = options?.find((o) => o.name === 'position')?.value as number;
  if (position < 0 || position > player.current.track.length) {
    return EmbedHandler.for(deps)
      .error()
      .title('Invalid Position')
      .description(
        `Position must be between 0 and ${player.current.track.length} ms (${formatDuration(player.current.track.length)}).`,
      )
      .respond(true);
  }

  await manager.seek(guildId, position);
  return EmbedHandler.for(deps)
    .primary()
    .title('Seeked', '⏩')
    .description(`Seeked to \`${formatDuration(position)}\`.`)
    .respond();
}

export const seekCommand: BotCommand = {
  def: seekCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handleSeekCommand,
};
