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
import { formatDuration, ensurePlayer } from '../../lib/music/utils.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const playOptions: ApplicationCommandOption[] = [
  {
    name: 'query',
    description: 'Track name, URL, or search query',
    type: ApplicationCommandOptionType.STRING,
    required: true,
  },
];

export const playCommandDef: ApplicationCommand = {
  name: 'play',
  description: 'Play a track or playlist',
  options: playOptions,
};

export async function handlePlayCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const options = interaction.data?.options as InteractionOption[] | undefined;
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
  if (!manager) {
    return EmbedHandler.for(deps)
      .error()
      .title('Unavailable')
      .description('Lavalink manager not initialized.')
      .respond(true);
  }
  if (!manager.isConnected()) {
    return EmbedHandler.for(deps)
      .error()
      .title('Not Connected')
      .description('Not connected to the Lavalink server yet.')
      .respond(true);
  }

  const guildIdStr = guildId;
  const error = await ensurePlayer(interaction, deps, manager);
  if (error) {
    return EmbedHandler.for(deps).error().title('Voice Channel Required').description(error).respond(true);
  }

  const query = options?.find((o) => o.name === 'query')?.value as string;
  if (!query) {
    return EmbedHandler.for(deps)
      .error()
      .title('Missing Query')
      .description('A search query or URL is required.')
      .respond(true);
  }

  const results = await manager.loadTracks(query);
  if (!results.data.length) {
    return EmbedHandler.for(deps)
      .error()
      .title('No Results')
      .description('No tracks found for that query.')
      .respond(true);
  }

  const player = await manager.getPlayer(guildIdStr);
  if (!player) {
    return EmbedHandler.for(deps).error().title('No Player').description('No active music player found.').respond(true);
  }

  const track = results.data[0];
  const isPlaylist = results.loadType === 'playlist';
  const requester = interaction.user?.id ?? interaction.member?.user.id ?? '';

  if (isPlaylist) {
    const toQueue = player.current ? results.data : results.data.slice(1);
    for (const t of toQueue) {
      player.queue.push({ track: t, requester, requestedAt: Date.now() });
    }
    if (!player.current) await manager.play(guildIdStr, track);
  } else if (!player.current) {
    await manager.play(guildIdStr, track);
  } else {
    player.queue.push({ track, requester, requestedAt: Date.now() });
  }

  const h = EmbedHandler.for(deps).success();
  if (isPlaylist) {
    h.title('Playlist Added', '📋')
      .description(`Added **${results.data.length}** tracks to queue`)
      .field('Queue Position', player.queue.length.toString(), true);
  } else {
    h.title('Track Queued', '🎵')
      .description(`**[${track.title}](${track.uri})** \`${formatDuration(track.length)}\``)
      .field('Duration', formatDuration(track.length), true)
      .field('Source', track.sourceName, true)
      .field('Queue Position', player.queue.length.toString(), true);
    if (track.artworkUrl) h.thumbnail(track.artworkUrl);
  }

  const username = interaction.user?.username ?? interaction.member?.user.username;
  if (username) h.footer(`Requested by ${username}`);

  return h.respond();
}

export const playCommand: BotCommand = {
  def: playCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handlePlayCommand,
};
