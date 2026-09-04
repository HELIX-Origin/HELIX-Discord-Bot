import { EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../types/command.js';

export const snowflake: CommandDefinition = {
  name: 'snowflake', description: 'Decode a Discord snowflake ID to a timestamp', category: 'utility',
  options: [{ name: 'id', description: 'Snowflake ID', type: 'string', required: true }],
  async execute({ message, interaction, getOption }) {
    const id = getOption<string>('id') || '';
    try {
      const ts = Number((BigInt(id) >> 22n) + 1420070400000n);
      const embed = new EmbedBuilder().setTitle('🔍 Snowflake Decode').setColor(0x00d2ff)
        .addFields({ name: 'Timestamp', value: `<t:${Math.floor(ts / 1000)}:F>`, inline: true }, { name: 'Relative', value: `<t:${Math.floor(ts / 1000)}:R>`, inline: true }).setTimestamp();
      if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
    } catch { const r = '❌ Invalid snowflake ID.'; if (message) await message.reply(r); else await interaction!.reply({ content: r, ephemeral: true }); }
  },
};
