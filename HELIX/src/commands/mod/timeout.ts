import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import { sendModLog } from '../../handlers/mod-log-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const timeout: CommandDefinition = {
  name: 'timeout',
  description: 'Timeout a member',
  category: 'moderation',
  usage: '>timeout <user> <minutes> [reason]',
  examples: ['>timeout @Spammer 10 Spamming chat', '>timeout @Disruptive 60'],
  permissions: [PermissionFlagsBits.ModerateMembers],
  options: [
    { name: 'user', description: 'Target user to timeout', type: 'user', required: true },
    { name: 'minutes', description: 'Duration in minutes (1-40320)', type: 'integer', required: true, minValue: 1, maxValue: 40320 },
    { name: 'reason', description: 'Reason for the timeout', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const target = getOption<GuildMember>('user');
    const minutes = getOption<number>('minutes') || 5;
    const reason = getOption<string>('reason') || 'No reason provided';
    const modUser = message?.author || interaction!.user;

    if (!target) {
      const err = formatError(getMessage('errors.invalid_user', { input: 'user' }));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    if (!target.moderatable) {
      const err = formatError(getMessage('moderation.timeout.cannot_timeout'));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    await target.timeout(minutes * 60_000, reason);
    BotDatabase.getInstance().logModeration({
      guildId: guild.id,
      userId: target.id,
      moderatorId: modUser.id,
      action: 'timeout',
      reason,
      durationMinutes: minutes,
    });

    await sendModLog({
      guild,
      action: 'timeout',
      target: target.user,
      moderator: modUser,
      reason,
      durationMinutes: minutes,
    });

    const embed = createEmbed('moderation.timeout.embed', {
      target: target.user.tag,
      minutes,
      reason,
    });

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
