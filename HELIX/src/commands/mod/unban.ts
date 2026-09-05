import { PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import { getCommandHelpEmbed } from '../../handlers/help-registrar.js';
import { botSettings } from '../../handlers/settings-manager.js';
import { sendModLog } from '../../handlers/mod-log-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const unban: CommandDefinition = {
  name: 'unban',
  description: 'Unban a user by ID',
  category: 'moderation',
  usage: '>unban <user_id> [reason]',
  examples: ['>unban 123456789012345678 Appeal granted'],
  permissions: [PermissionFlagsBits.BanMembers],
  options: [
    { name: 'user_id', description: 'Discord User ID to unban', type: 'string', required: true },
    { name: 'reason', description: 'Reason for the unban', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const userId = getOption<string>('user_id');
    const reason = getOption<string>('reason') || 'No reason provided';
    const modUser = message?.author || interaction!.user;

    if (!userId) {
      const prefix = guild ? botSettings.getPrefix(guild.id) : '>';
      const helpEmbed = getCommandHelpEmbed('unban', prefix, {
        missingNotice: 'Please provide a `<user_id>` to unban.',
      });
      if (message) return message.reply({ embeds: [helpEmbed!] });
      return interaction!.reply({ embeds: [helpEmbed!], ephemeral: true });
    }

    try {
      await guild.members.unban(userId, reason);
      BotDatabase.getInstance().logModeration({
        guildId: guild.id,
        userId,
        moderatorId: modUser.id,
        action: 'unban',
        reason,
      });

      await sendModLog({
        guild,
        action: 'unban',
        target: { id: userId, tag: `User <@${userId}>` },
        moderator: modUser,
        reason,
      });

      const embed = createEmbed('moderation.unban.embed', {
        userId,
        moderatorId: modUser.id,
        reason,
      });

      if (message) await message.reply({ embeds: [embed] });
      else await interaction!.reply({ embeds: [embed] });
    } catch (err: any) {
      const errorEmbed = formatError(getMessage('moderation.unban.failed', { reason: err.message }));
      if (message) await message.reply({ embeds: [errorEmbed] });
      else await interaction!.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
