import { BotDatabase } from '../../db/database.js';
import { createEmbed } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const status: CommandDefinition = {
  name: 'status',
  description: 'Report HELIX system health and database statistics',
  category: 'info',
  async execute({ message, interaction }) {
    const db = BotDatabase.getInstance();
    const stats = db.getStats();
    const client = (message || interaction!)!.client;

    const embed = createEmbed('info.status.embed', {
      gateway: client.ws.ping,
      dbSize: Math.round(stats.sizeBytes / 1024),
      guildCount: client.guilds.cache.size,
      ticketCount: stats.ticketCount,
      scaffoldCount: stats.scaffoldCount,
      warningCount: stats.warningCount,
    });

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
