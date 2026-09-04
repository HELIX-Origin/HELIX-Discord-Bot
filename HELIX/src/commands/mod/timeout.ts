import { EmbedBuilder, GuildMember } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import type { CommandDefinition } from '../../types/command.js';

export const timeout: CommandDefinition = {
  name: 'timeout', description: 'Timeout a member',
  category: 'moderation', permissions: ['32' as any],
  options: [
    { name: 'user', description: 'Target user', type: 'user', required: true },
    { name: 'minutes', description: 'Duration in minutes', type: 'integer', required: true, minValue: 1, maxValue: 40320 },
    { name: 'reason', description: 'Reason', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const target = getOption<GuildMember>('user');
    const minutes = getOption<number>('minutes');
    const reason = getOption<string>('reason') || 'No reason provided';
    if (!target || !minutes) { const r = '❌ User and duration required.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    await target.timeout(minutes * 60_000, reason);
    BotDatabase.getInstance().logModeration({ guildId: guild.id, userId: target.id, moderatorId: message?.author.id || interaction!.user.id, action: 'timeout', reason, durationMinutes: minutes });
    const embed = new EmbedBuilder().setTitle('⏳ Timed Out').setColor(0xffaa00).addFields({ name: 'Target', value: target.user.tag, inline: true }, { name: 'Duration', value: `${minutes}m`, inline: true }, { name: 'Reason', value: reason }).setTimestamp();
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
