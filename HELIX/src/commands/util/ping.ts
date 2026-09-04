import { EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../types/command.js';

export const ping: CommandDefinition = {
  name: 'ping', description: 'Check Discord WebSocket latency', category: 'utility',
  async execute({ message, interaction }) {
    const fmt = (ms: number) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h ${Math.floor((s % 3600) / 60)}m`; };
    const client = (message || interaction!)!.client;
    const embed = new EmbedBuilder().setTitle('🏓 Pong!').setColor(0x00d2ff).addFields({ name: 'Gateway', value: `${client.ws.ping}ms`, inline: true }, { name: 'Uptime', value: fmt(client.uptime), inline: true }).setTimestamp();
    if (message) { const sent = await message.reply('🏓 Pinging...'); await sent.edit({ content: null, embeds: [embed] }); }
    else await interaction!.reply({ embeds: [embed] });
  },
};
