import { EmbedBuilder, GuildMember } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import type { CommandDefinition } from '../../types/command.js';

export const ban: CommandDefinition = {
  name: 'ban', description: 'Ban a member from the server',
  category: 'moderation', permissions: ['4' as any],
  options: [
    { name: 'user', description: 'Target user', type: 'user', required: true },
    { name: 'reason', description: 'Reason', type: 'string', required: false },
    { name: 'delete_days', description: 'Days of messages to delete (0-7)', type: 'integer', required: false, minValue: 0, maxValue: 7 },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const target = getOption<GuildMember>('user');
    const reason = getOption<string>('reason') || 'No reason provided';
    const days = getOption<number>('delete_days') || 0;
    if (!target) { const r = '❌ User not found.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }
    if (!target.bannable) { const r = '❌ I cannot ban this user.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    await target.ban({ deleteMessageSeconds: days * 86400, reason });
    BotDatabase.getInstance().logModeration({ guildId: guild.id, userId: target.id, moderatorId: message?.author.id || interaction!.user.id, action: 'ban', reason });
    const embed = new EmbedBuilder().setTitle('🔨 Member Banned').setColor(0xff4444).addFields({ name: 'Target', value: target.user.tag, inline: true }, { name: 'Reason', value: reason }).setTimestamp();
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
