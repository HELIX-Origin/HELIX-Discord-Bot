import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import { sendModLog } from '../../handlers/mod-log-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const kick: CommandDefinition = {
  name: 'kick',
  description: 'Kick a member from the server',
  category: 'moderation',
  usage: '>kick <user> [reason]',
  examples: ['>kick @DisruptiveUser Breaking rules repeatedly'],
  permissions: [PermissionFlagsBits.KickMembers],
  options: [
    { name: 'user', description: 'Target user to kick', type: 'user', required: true },
    { name: 'reason', description: 'Reason for the kick', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const target = getOption<GuildMember>('user');
    const reason = getOption<string>('reason') || 'No reason provided';
    const modUser = message?.author || interaction!.user;

    if (!target) {
      const err = formatError(getMessage('moderation.kick.not_found'));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    if (!target.kickable) {
      const err = formatError(getMessage('moderation.kick.cannot_kick'));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    await target.kick(reason);
    BotDatabase.getInstance().logModeration({
      guildId: guild.id,
      userId: target.id,
      moderatorId: modUser.id,
      action: 'kick',
      reason,
    });

    await sendModLog({
      guild,
      action: 'kick',
      target: target.user,
      moderator: modUser,
      reason,
    });

    const embed = createEmbed('moderation.kick.embed', {
      target: target.user.tag,
      moderatorId: modUser.id,
      reason,
    });

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
