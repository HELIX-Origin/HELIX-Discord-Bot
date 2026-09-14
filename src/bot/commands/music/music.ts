import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { NodeLinkManager } from '../../music/nodelink.js';
import { createLogger } from '../../../util/logger.js';

const _logger = createLogger('music', 'warn');

const MUSIC_COMMANDS = [
  {
    name: 'play',
    description: 'Play a track or playlist',
    options: [
      {
        name: 'query',
        description: 'Track name, URL, or search query',
        type: ApplicationCommandOptionType.STRING,
        required: true,
        autocomplete: true,
      },
    ],
  },
  { name: 'queue', description: 'Show the current queue', options: [] },
  { name: 'skip', description: 'Skip the current track', options: [] },
  { name: 'previous', description: 'Go back to the previously played track', options: [] },
  {
    name: 'jump',
    description: 'Jump to a specific track in the queue',
    options: [
      {
        name: 'position',
        description: 'Track position in queue (1-indexed)',
        type: ApplicationCommandOptionType.INTEGER,
        required: true,
      },
    ],
  },
  { name: 'leave', description: 'Stop music and leave voice channel', options: [] },
  {
    name: 'volume',
    description: 'Set or view volume',
    options: [
      {
        name: 'level',
        description: 'Volume level (0-200)',
        type: ApplicationCommandOptionType.INTEGER,
        required: false,
        min_value: 0,
        max_value: 200,
      },
    ],
  },
  {
    name: 'equalizer',
    description: 'Set equalizer preset',
    options: [
      {
        name: 'preset',
        description: 'Equalizer preset',
        type: ApplicationCommandOptionType.STRING,
        required: true,
        choices: [
          { name: 'Flat', value: 'flat' },
          { name: 'Bass Boost', value: 'bassboost' },
          { name: 'Pop', value: 'pop' },
          { name: 'Rock', value: 'rock' },
          { name: 'Electronic', value: 'electronic' },
          { name: 'Classical', value: 'classical' },
          { name: 'Hip Hop', value: 'hiphop' },
          { name: 'Jazz', value: 'jazz' },
          { name: 'Custom', value: 'custom' },
        ],
      },
    ],
  },
  { name: 'nowplaying', description: 'Show currently playing track', options: [] },
  { name: 'pause', description: 'Pause playback', options: [] },
  { name: 'resume', description: 'Resume playback', options: [] },
  {
    name: 'seek',
    description: 'Seek to position in current track',
    options: [
      {
        name: 'position',
        description: 'Position in milliseconds',
        type: ApplicationCommandOptionType.INTEGER,
        required: true,
        min_value: 0,
      },
    ],
  },
  { name: 'shuffle', description: 'Shuffle the queue', options: [] },
  {
    name: 'loop',
    description: 'Set loop mode',
    options: [
      {
        name: 'mode',
        description: 'Loop mode',
        type: ApplicationCommandOptionType.STRING,
        required: true,
        choices: [
          { name: 'Off', value: 'none' },
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' },
        ],
      },
    ],
  },
];

export const musicCommandDefs: ApplicationCommand[] = MUSIC_COMMANDS.map((cmd) => ({
  name: cmd.name,
  description: cmd.description,
  options: cmd.options,
}));

function formatDuration(ms: number): string {
  if (ms < 0) return 'Unknown';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    : `${m}:${sec.toString().padStart(2, '0')}`;
}

interface QueueItem {
  track: { title: string; uri: string; length: number };
  requester: string;
}

function formatQueue(queue: QueueItem[], current: QueueItem | null): string {
  if (!queue.length && !current) return 'Queue is empty';
  let output = '';
  if (current) {
    output += `**Now Playing:** [${current.track.title}](${current.track.uri}) \`${formatDuration(current.track.length)}\`\n\n`;
  }
  if (queue.length) {
    output += '**Up Next:**\n';
    queue.slice(0, 10).forEach((item, i) => {
      output += `\`${i + 1}.\` [${item.track.title}](${item.track.uri}) \`${formatDuration(item.track.length)}\` - <@${item.requester}>\n`;
    });
    if (queue.length > 10) output += `... and ${queue.length - 10} more`;
  }
  return output;
}

async function ensurePlayer(
  interaction: DiscordInteraction,
  deps: AppDeps,
  manager: NodeLinkManager,
): Promise<string | null> {
  const guildId = interaction.guild_id;
  if (!guildId) return null;

  const member = interaction.member;
  // Voice state is not on interaction member; get from guild voice states or gateway
  // For now, we'll require the channel to be passed or fetched from gateway
  const voiceState = (member as unknown as { voice_state?: { channel_id?: string } })?.voice_state;
  const channelId = voiceState?.channel_id;

  if (!channelId) {
    return '❌ You must be in a voice channel to use music commands.';
  }

  const player = await manager.getPlayer(interaction.guild_id!);
  if (!player) {
    await manager.createPlayer(guildId);
    await manager.connectVoice(guildId, channelId);
  }

  return null;
}

export async function handleMusicCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const commandName = interaction.data?.name;
  const options = interaction.data?.options as InteractionOption[] | undefined;
  const guildId = interaction.guild_id;

  if (!guildId) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: 64, content: '❌ Music commands can only be used in a server.' },
    };
  }

  if (!deps.config.features.nodeLinkEnabled) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: 64, content: '❌ Music features are disabled.' },
    };
  }

  const manager = deps.nodeLinkManager ?? null;
  if (!manager) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: 64, content: '❌ NodeLink manager not initialized.' },
    };
  }

  const error = await ensurePlayer(interaction, deps, manager);
  if (error) {
    return { type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { flags: 64, content: error } };
  }

  const guildIdStr = guildId!;
  const player = await manager.getPlayer(guildIdStr);
  if (!player) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: 64, content: '❌ No active player.' },
    };
  }

  try {
    switch (commandName) {
      case 'play': {
        const query = options?.find((o) => o.name === 'query')?.value as string;
        if (!query)
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Query is required.' },
          };

        const results = await manager.loadTracks(query);
        if (!results.data.length) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ No results found.' },
          };
        }

        const track = results.data[0];
        const isPlaylist = results.loadType === 'playlist';
        if (isPlaylist) {
          for (const t of results.data) {
            player.queue.push({ track: t, requester: interaction.user!.id, requestedAt: Date.now() });
          }
          await manager.play(guildId, results.data[0]);
        } else {
          if (!player.current) {
            await manager.play(guildIdStr, track);
          } else {
            player.queue.push({ track, requester: interaction.user!.id, requestedAt: Date.now() });
          }
        }

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                title: isPlaylist ? '📋 Playlist Added' : '🎵 Track Queued',
                description: isPlaylist
                  ? `Added **${results.data.length}** tracks`
                  : `**[${track.title}](${track.uri})** \`${formatDuration(track.length)}\``,
                color: 0x10b981,
                thumbnail: { url: track.artworkUrl ?? '' },
                fields: [
                  { name: 'Duration', value: formatDuration(track.length), inline: true },
                  { name: 'Source', value: track.sourceName, inline: true },
                  { name: 'Queue Position', value: player.queue.length.toString(), inline: true },
                ],
                footer: { text: `Requested by ${interaction.user?.username}` },
              },
            ],
          },
        };
      }

      case 'queue': {
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: formatQueue(player.queue, player.current) },
        };
      }

      case 'skip':
      case 'next': {
        if (!player.current) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Nothing is playing.' },
          };
        }
        await manager.stop(guildIdStr);
        return { type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: '⏭️ Skipped.' } };
      }

      case 'previous':
      case 'back': {
        const prev = await manager.previous(guildIdStr);
        if (!prev) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ No previous track to go back to.' },
          };
        }
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `⏮️ Now playing: **${prev.track.title}**` },
        };
      }

      case 'jump': {
        const position = options?.find((o) => o.name === 'position')?.value as number;
        if (!position || position < 1 || position > player.queue.length) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Invalid position.' },
          };
        }
        const [jumped] = player.queue.splice(position - 1, 1);
        player.queue.unshift(jumped);
        await manager.stop(guildIdStr);
        await manager.play(guildIdStr, jumped.track);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `⏭️ Jumped to position ${position}.` },
        };
      }

      case 'leave': {
        await manager.destroyPlayer(guildIdStr);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: '👋 Left voice channel and cleared queue.' },
        };
      }

      case 'volume': {
        const level = options?.find((o) => o.name === 'level')?.value as number | undefined;
        if (level === undefined) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: `🔊 Current volume: **${player.volume}%**` },
          };
        }
        if (level < 0 || level > 200) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Volume must be between 0 and 200.' },
          };
        }
        await manager.setVolume(guildIdStr, level);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `🔊 Volume set to **${level}%**` },
        };
      }

      case 'equalizer': {
        const preset = options?.find((o) => o.name === 'preset')?.value as string;
        const presets: Record<string, unknown[]> = {
          flat: [],
          bassboost: [{ band: 0, gain: 0.6 }],
          pop: [
            { band: 0, gain: -0.25 },
            { band: 1, gain: 0.5 },
            { band: 2, gain: -0.25 },
          ],
          rock: [
            { band: 0, gain: 0.5 },
            { band: 1, gain: 0.25 },
            { band: 12, gain: -0.5 },
          ],
          electronic: [
            { band: 0, gain: 0.5 },
            { band: 1, gain: 0.5 },
            { band: 2, gain: 0.25 },
          ],
          classical: [
            { band: 0, gain: 0.25 },
            { band: 1, gain: 0.25 },
            { band: 2, gain: 0.25 },
          ],
          hiphop: [
            { band: 0, gain: 0.75 },
            { band: 1, gain: 0.25 },
          ],
          jazz: [
            { band: 0, gain: 0.5 },
            { band: 1, gain: 0.25 },
            { band: 2, gain: 0.5 },
          ],
          custom: [],
        };
        if (!presets[preset]) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Invalid preset.' },
          };
        }
        await manager.setFilter(guildIdStr, { equalizer: { bands: presets[preset] } });
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `🎛️ Equalizer set to **${preset}**.` },
        };
      }

      case 'nowplaying':
      case 'np': {
        if (!player.current) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Nothing is playing.' },
          };
        }
        const track = player.current.track;
        const progress = player.position;
        const bar = '▬'.repeat(20);
        const pos = Math.min(Math.round((player.position / track.length) * 20), 20);
        const progressBar = bar.slice(0, pos) + '🔘' + bar.slice(pos + 1);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                title: '🎵 Now Playing',
                description: `**[${track.title}](${track.uri})**\n\`${formatDuration(progress)} / ${formatDuration(track.length)}\`\n${progressBar}`,
                color: 0x06b6d4,
                thumbnail: { url: track.artworkUrl ?? '' },
                fields: [
                  { name: 'Requested by', value: `<@${player.current.requester}>`, inline: true },
                  { name: 'Volume', value: `${player.volume}%`, inline: true },
                  { name: 'Loop', value: player.loop, inline: true },
                ],
                footer: { text: `Source: ${track.sourceName}` },
              },
            ],
          },
        };
      }

      case 'pause': {
        if (!player.current || player.paused) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Nothing to pause.' },
          };
        }
        await manager.pause(guildIdStr, true);
        return { type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: '⏸️ Paused.' } };
      }

      case 'resume': {
        if (!player.current || !player.paused) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Nothing to resume.' },
          };
        }
        await manager.pause(guildIdStr, false);
        return { type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: '▶️ Resumed.' } };
      }

      case 'stop': {
        if (!player.current && !player.queue.length) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Nothing is playing.' },
          };
        }
        await manager.stop(guildIdStr);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: '⏹️ Stopped and cleared queue.' },
        };
      }

      case 'seek': {
        const position = options?.find((o) => o.name === 'position')?.value as number;
        if (!player.current)
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Nothing is playing.' },
          };
        if (position < 0 || position > player.current.track.length) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Invalid position.' },
          };
        }
        await manager.seek(guildIdStr, position);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `⏩ Seeked to ${formatDuration(position)}.` },
        };
      }

      case 'shuffle': {
        if (!player.queue.length) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64, content: '❌ Queue is empty.' },
          };
        }
        for (let i = player.queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
        }
        return { type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: '🔀 Queue shuffled.' } };
      }

      case 'loop': {
        const mode = options?.find((o) => o.name === 'mode')?.value as 'none' | 'track' | 'queue';
        await manager.setLoop(guildIdStr, mode);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `🔁 Loop mode set to **${mode}**.` },
        };
      }

      default:
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: `❌ Unknown music command: ${commandName}` },
        };
    }
  } catch (err) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: 64, content: `❌ Error: ${(err as Error).message}` },
    };
  }
}

export async function handleMusicAutocomplete(
  interaction: DiscordInteraction,
  deps: AppDeps,
): Promise<InteractionResponse> {
  const _focused = interaction.data?.options?.[0]?.focused as boolean | undefined;
  const value = (interaction.data?.options?.[0]?.value as string | undefined)?.toLowerCase() ?? '';

  if (!deps.config.features.nodeLinkEnabled) {
    return { type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices: [] } };
  }

  // Provide search suggestions
  const suggestions = ['lofi hip hop', 'chill music', 'gaming music', 'anime openings', 'video game soundtracks']
    .filter((s) => s.toLowerCase().startsWith(value))
    .slice(0, 25)
    .map((s) => ({ name: s, value: s }));

  return {
    type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
    data: { choices: suggestions },
  };
}
