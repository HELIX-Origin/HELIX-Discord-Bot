import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import { sendModLog } from '../../handlers/mod-log-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const ban: CommandDefinition = {
  name: 'ban',
  description: 'Ban a member from the server',
  category: 'moderation',
  usage: '>ban <user> [reason] [delete_days]',
  examples: ['>ban @BadUser Spamming server invites', '>ban 123456789012345678 Rule violation 1'],
  permissions: [PermissionFlagsBits.BanMembers],
  options: [
    { name: 'user', description: 'Target user to ban', type: 'user', required: true },
    { name: 'reason', description: 'Reason for the ban', type: 'string', required: false },
    { name: 'delete_days', description: 'Days of messages to delete (0-7)', type: 'integer', required: false, minValue: 0, maxValue: 7 },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const target = getOption<GuildMember>('user');
    const reason = getOption<string>('reason') || 'No reason provided';
    const days = getOption<number>('delete_days') || 0;
    const modUser = message?.author || interaction!.user;

    if (!target) {
      const err = formatError(getMessage('moderation.ban.not_found'));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    if (!target.bannable) {
      const err = formatError(getMessage('moderation.ban.cannot_ban'));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    await target.ban({ deleteMessageSeconds: days * 86400, reason });
    BotDatabase.getInstance().logModeration({
      guildId: guild.id,
      userId: target.id,
      moderatorId: modUser.id,
      action: 'ban',
      reason,
    });

    await sendModLog({
      guild,
      action: 'ban',
      target: target.user,
      moderator: modUser,
      reason,
    });

    const embed = createEmbed('moderation.ban.embed', {
      target: target.user.tag,
      moderatorId: modUser.id,
      reason,
      days,
    });

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
