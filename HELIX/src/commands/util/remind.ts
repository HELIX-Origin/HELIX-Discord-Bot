import { EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../types/command.js';

export const remind: CommandDefinition = {
  name: 'remind', description: 'Set a reminder that DMs you later', category: 'utility',
  options: [
    { name: 'minutes', description: 'Minutes from now', type: 'integer', required: true, minValue: 1, maxValue: 10080 },
    { name: 'message', description: 'Reminder message', type: 'string', required: true },
  ],
  async execute({ message, interaction, getOption, user }) {
    const minutes = getOption<number>('minutes');
    const text = getOption<string>('message');
    if (!minutes || !text) { const r = '❌ Duration and message required.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    setTimeout(() => { user.send(`⏰ **Reminder:** ${text}`).catch(() => {}); }, minutes * 60_000);
    const embed = new EmbedBuilder().setTitle('⏰ Reminder Set').setColor(0x00ff88).setDescription(`I'll DM you in **${minutes} minute(s)** with: ${text}`).setTimestamp();
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
