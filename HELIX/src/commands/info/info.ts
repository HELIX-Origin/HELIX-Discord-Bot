import { EmbedBuilder } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import type { CommandDefinition } from '../../types/command.js';

export const info: CommandDefinition = {
  name: 'info', description: 'Show comprehensive system diagnostics', category: 'info',
  async execute({ message, interaction }) {
    const stats = BotDatabase.getInstance().getStats();
    const mem = process.memoryUsage();
    const fmt = (ms: number) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h ${Math.floor((s % 3600) / 60)}m`; };
    const client = (message || interaction!)!.client;

    const embed = new EmbedBuilder().setTitle('📊 HELIX Diagnostics').setColor(0x00d2ff).addFields(
      { name: 'Node.js', value: process.version, inline: true },
      { name: 'Platform', value: `${process.platform} ${process.arch}`, inline: true },
      { name: 'Gateway', value: `${client.ws.ping}ms`, inline: true },
      { name: 'Guilds', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Uptime', value: fmt(client.uptime), inline: true },
      { name: 'Memory', value: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true },
      { name: 'DB', value: `${(stats.sizeBytes / 1024).toFixed(1)} KB`, inline: true },
      { name: 'Sessions', value: `${stats.sessionCount}`, inline: true },
    ).setTimestamp();

    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
