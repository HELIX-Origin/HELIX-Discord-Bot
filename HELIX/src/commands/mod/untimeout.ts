import { EmbedBuilder, GuildMember } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import type { CommandDefinition } from '../../types/command.js';

export const untimeout: CommandDefinition = {
  name: 'untimeout', description: 'Remove a timeout from a member',
  category: 'moderation', permissions: ['32' as any],
  options: [
    { name: 'user', description: 'Target user', type: 'user', required: true },
    { name: 'reason', description: 'Reason', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const target = getOption<GuildMember>('user');
    const reason = getOption<string>('reason') || 'No reason provided';
    if (!target) { const r = '❌ User required.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    await target.timeout(null, reason);
    BotDatabase.getInstance().logModeration({ guildId: guild.id, userId: target.id, moderatorId: message?.author.id || interaction!.user.id, action: 'untimeout', reason });
    const embed = new EmbedBuilder().setTitle('⏰ Timeout Removed').setColor(0x00ff88).addFields({ name: 'Target', value: target.user.tag, inline: true }, { name: 'Reason', value: reason }).setTimestamp();
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
