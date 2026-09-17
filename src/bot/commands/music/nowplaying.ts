import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { type ApplicationCommand, type DiscordInteraction, type InteractionResponse } from '../../utils/types.js';
import { formatDuration } from '../../lib/music/utils.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const nowplayingCommandDef: ApplicationCommand = {
  name: 'nowplaying',
  description: 'Show currently playing track',
  options: [],
};

export const npCommandDef: ApplicationCommand = {
  name: 'np',
  description: 'Show currently playing track',
  options: [],
};

export async function handleNowPlayingCommand(
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
  if (!player || !player.current) {
    return EmbedHandler.for(deps)
      .error()
      .title('Nothing Playing')
      .description('Nothing is currently playing.')
      .respond(true);
  }

  const track = player.current.track;
  const progress = player.position;
  const isLive = track.length <= 0;
  const progressBar = isLive
    ? '🔴 LIVE'
    : (() => {
        const bar = '▬'.repeat(20);
        const pos = Math.min(Math.round((player.position / track.length) * 20), 20);
        return bar.slice(0, pos) + '🔘' + bar.slice(pos + 1);
      })();

  const h = EmbedHandler.for(deps)
    .primary()
    .title('Now Playing', '🎵')
    .description(
      `**[${track.title}](${track.uri})**\n${isLive ? '🔴 LIVE' : `\`${formatDuration(progress)} / ${formatDuration(track.length)}\`\n${progressBar}`}`,
    )
    .field('Requested by', `<@${player.current.requester}>`, true)
    .field('Volume', `${player.volume}%`, true)
    .field('Loop', player.loop, true)
    .footer(`Source: ${track.sourceName}`);

  if (track.artworkUrl) h.thumbnail(track.artworkUrl);

  return h.respond();
}

export const nowplayingCommand: BotCommand = {
  def: nowplayingCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handleNowPlayingCommand,
  aliases: ['np'],
};
