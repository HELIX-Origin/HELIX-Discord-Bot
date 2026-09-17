import type { AppDeps } from '../../../app.js';
import type { DiscordInteraction } from '../../utils/types.js';
import { LavalinkManager } from '../../music/lavalink.js';
import { createLogger } from '../../../util/logger.js';

const _logger = createLogger('music', 'warn');

export function formatDuration(ms: number): string {
  if (ms < 0) return 'Unknown';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    : `${m}:${sec.toString().padStart(2, '0')}`;
}

export interface QueueItem {
  track: { title: string; uri: string; length: number };
  requester: string;
}

export function formatQueue(queue: QueueItem[], current: QueueItem | null): string {
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

export async function ensurePlayer(
  interaction: DiscordInteraction,
  deps: AppDeps,
  manager: LavalinkManager,
): Promise<string | null> {
  const guildId = interaction.guild_id;
  if (!guildId) return null;

  const userId = interaction.user?.id ?? interaction.member?.user.id;
  if (!userId) return null;

  const channelId = (await deps.bot?.getUserVoiceChannelId(guildId, userId)) ?? null;

  if (!channelId) {
    return '❌ You must be in a voice channel to use music commands.';
  }

  const player = await manager.getPlayer(guildId);
  if (!player) {
    await manager.createPlayer(guildId);
  }
  await manager.connectVoice(guildId, channelId);

  return null;
}
