import { Guild, User, GuildMember, EmbedBuilder, Colors } from 'discord.js';
import { BotDatabase } from '../db/database.js';
import { botSettings } from './settings-manager.js';
import { logs } from './logs-handler.js';

export interface ModLogOptions {
  guild: Guild;
  action: 'ban' | 'kick' | 'warn' | 'timeout' | 'untimeout' | 'purge' | 'unban';
  target: User | GuildMember | { id: string; tag?: string; username?: string };
  moderator: User | GuildMember | { id: string; tag?: string; username?: string };
  reason?: string;
  durationMinutes?: number;
  count?: number;
  db?: BotDatabase;
}

const ACTION_COLORS: Record<string, number> = {
  ban: Colors.Red,
  kick: Colors.Orange,
  warn: Colors.Yellow,
  timeout: Colors.Gold,
  untimeout: Colors.Green,
  purge: Colors.Purple,
  unban: Colors.Aqua,
};

const ACTION_EMOJIS: Record<string, string> = {
  ban: '🔨',
  kick: '👢',
  warn: '⚠️',
  timeout: '⏳',
  untimeout: '⏱️',
  purge: '🧹',
  unban: '🔓',
};

export async function sendModLog(options: ModLogOptions): Promise<boolean> {
  const { guild, action, target, moderator, reason, durationMinutes, count, db: customDb } = options;
  if (!guild) return false;

  const logChannelId = customDb ? customDb.getGuildSettings(guild.id)?.modLogChannelId : botSettings.getModLogChannelId(guild.id);
  if (!logChannelId) return false;

  try {
    const channel = await guild.channels.fetch(logChannelId).catch(() => null);
    if (!channel || !channel.isTextBased() || channel.isThread()) return false;

    const targetTag = (target as any).user?.tag || (target as any).tag || (target as any).username || target.id;
    const targetId = target.id;
    const modTag = (moderator as any).user?.tag || (moderator as any).tag || (moderator as any).username || moderator.id;
    const modId = moderator.id;

    const emoji = ACTION_EMOJIS[action] || '🛡️';
    const actionTitle = action.toUpperCase();

    const embed = new EmbedBuilder()
      .setColor(ACTION_COLORS[action] || Colors.Blue)
      .setTitle(`${emoji} Moderation Log: ${actionTitle}`)
      .setDescription('Moderation action has been logged for audit trail.')
      .addFields(
        { name: 'Target User', value: `${targetTag} (\`${targetId}\`)`, inline: true },
        { name: 'Moderator', value: `${modTag} (\`${modId}\`)`, inline: true },
        { name: 'Reason', value: reason || 'No reason provided', inline: false }
      )
      .setTimestamp();

    if (durationMinutes) {
      embed.addFields({ name: 'Duration', value: `${durationMinutes} minute(s)`, inline: true });
    }

    if (count !== undefined) {
      embed.addFields({ name: 'Messages Purged', value: String(count), inline: true });
    }

    await (channel as any).send({ embeds: [embed] });
    return true;
  } catch (err: any) {
    logs.warn(`Failed to send moderation log in guild ${guild.id}: ${err.message}`);
    return false;
  }
}
