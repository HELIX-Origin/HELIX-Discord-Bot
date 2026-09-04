import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const unban: CommandDefinition = {
  name: 'unban',
  description: 'Unban a user by ID',
  category: 'moderation',
  permissions: ['4' as any],
  options: [
    { name: 'user_id', description: 'User ID to unban', type: 'string', required: true },
    { name: 'reason', description: 'Reason', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const userId = getOption<string>('user_id');
    const reason = getOption<string>('reason') || 'No reason provided';

    if (!userId) {
      const err = formatError(getMessage('errors.missing_argument', { arg: 'user_id' }));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    try {
      await guild.members.unban(userId, reason);
      BotDatabase.getInstance().logModeration({
        guildId: guild.id,
        userId,
        moderatorId: message?.author.id || interaction!.user.id,
        action: 'unban',
        reason,
      });

      const embed = createEmbed('moderation.unban.embed', {
        userId,
        moderatorId: message?.author.id || interaction!.user.id,
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
