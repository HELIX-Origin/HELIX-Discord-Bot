import { EmbedBuilder } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import type { CommandDefinition } from '../../types/command.js';

export const unban: CommandDefinition = {
  name: 'unban', description: 'Unban a user from the server',
  category: 'moderation', permissions: ['4' as any],
  options: [
    { name: 'user_id', description: 'User ID to unban', type: 'string', required: true },
    { name: 'reason', description: 'Reason', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const userId = getOption<string>('user_id')?.replace(/[<@!>]/g, '');
    const reason = getOption<string>('reason') || 'No reason provided';
    if (!userId) { const r = '❌ User ID required.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    try {
      await guild.members.unban(userId, reason);
      BotDatabase.getInstance().logModeration({ guildId: guild.id, userId, moderatorId: message?.author.id || interaction!.user.id, action: 'unban', reason });
      const embed = new EmbedBuilder().setTitle('🔓 Member Unbanned').setColor(0x00ff88).addFields({ name: 'User ID', value: userId, inline: true }, { name: 'Reason', value: reason }).setTimestamp();
      if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
    } catch (err: any) {
      if (message) await message.reply(`❌ Failed: ${err.message}`); else await interaction!.reply({ content: `❌ Failed: ${err.message}`, ephemeral: true });
    }
  },
};
