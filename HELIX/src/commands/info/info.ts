import { version as djsVersion } from 'discord.js';
import { BOT_VERSION } from '../../config.js';
import { createEmbed } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const info: CommandDefinition = {
  name: 'info',
  description: 'Display bot diagnostics and information',
  category: 'info',
  usage: '',
  examples: ['info'],
  async execute({ message, interaction }) {
    const mem = process.memoryUsage();
    const used = Math.round(mem.heapUsed / 1024 / 1024);
    const total = Math.round(mem.heapTotal / 1024 / 1024);
    const uptimeSec = Math.floor(process.uptime());
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const client = (message || interaction!)!.client;

    const embed = createEmbed('info.info.embed', {
      version: BOT_VERSION,
      nodeVersion: process.version,
      djsVersion,
      uptime: `${days}d ${hours}h ${mins}m`,
      guildCount: client.guilds.cache.size,
      memoryUsed: used,
      memoryTotal: total,
    });

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
