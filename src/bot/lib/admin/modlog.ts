import type { AppDeps } from '../../../app.js';
import { EmbedHandler } from '../embeds/builder.js';
import type { DiscordEmbed } from '../../utils/types.js';

export type ModAction =
  'warn' | 'kick' | 'ban' | 'unban' | 'mute' | 'unmute' | 'purge' | 'slowmode' | 'lock' | 'unlock';

export interface ModLogEntry {
  action: ModAction;
  moderatorId: string;
  moderatorTag: string;
  targetId: string;
  targetTag: string;
  reason?: string | null;
  duration?: string | null;
  caseNumber?: number;
}

const ACTION_EMOJIS: Record<ModAction, string> = {
  warn: '⚠️',
  kick: '👢',
  ban: '🔨',
  unban: '🔓',
  mute: '🔇',
  unmute: '🔊',
  purge: '🧹',
  slowmode: '⏱️',
  lock: '🔒',
  unlock: '🔓',
};

export function buildModLogEmbed(entry: ModLogEntry, deps: AppDeps): DiscordEmbed {
  const emoji = ACTION_EMOJIS[entry.action] ?? '🛡️';
  const actionTitle = `${emoji} Case ${entry.caseNumber ? `#${entry.caseNumber}` : ''} | ${entry.action.toUpperCase()}`;

  const h = EmbedHandler.for(deps)
    .warning()
    .title(actionTitle)
    .field('Target', `<@${entry.targetId}> (${entry.targetTag})`, true)
    .field('Moderator', `<@${entry.moderatorId}> (${entry.moderatorTag})`, true);

  if (entry.duration) {
    h.field('Duration', entry.duration, true);
  }

  h.field('Reason', entry.reason || 'No reason provided', false);
  h.footer(`Target ID: ${entry.targetId}`);

  return h.build();
}

export async function dispatchModLog(guildId: string, entry: ModLogEntry, deps: AppDeps): Promise<void> {
  const modLogChannelId = deps.repo.getGuildSetting(guildId, 'mod_log_channel_id');
  if (!modLogChannelId || !deps.bot) return;

  try {
    const embed = buildModLogEmbed(entry, deps);
    await deps.bot.rest.sendChannelMessage(modLogChannelId, {
      embeds: [embed],
    });
  } catch (err) {
    deps.bot.logger.warn(`Failed to dispatch mod log to channel ${modLogChannelId}`, {
      guildId,
      err: (err as Error).message,
    });
  }
}
