import { EmbedBuilder } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import type { CommandDefinition } from '../../types/command.js';

export const status: CommandDefinition = {
  name: 'status', description: 'Report system health', category: 'info',
  async execute({ message, interaction }) {
    const stats = BotDatabase.getInstance().getStats();
    const embed = new EmbedBuilder().setTitle('💚 HELIX Status').setColor(0x00ff88).addFields(
      { name: 'Guilds', value: `${(message || interaction!)!.client.guilds.cache.size}`, inline: true },
      { name: 'Sessions', value: `${stats.sessionCount}`, inline: true },
      { name: 'Scaffolds', value: `${stats.scaffoldCount}`, inline: true },
      { name: 'Tickets', value: `${stats.ticketCount}`, inline: true },
      { name: 'Mod Actions', value: `${stats.moderationCount}`, inline: true },
      { name: 'Warnings', value: `${stats.warningCount}`, inline: true },
    ).setTimestamp();
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
