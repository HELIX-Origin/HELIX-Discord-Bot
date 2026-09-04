import { EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../types/command.js';

export const list: CommandDefinition = {
  name: 'list', description: 'List available templates and integrations', category: 'info',
  options: [{ name: 'category', description: 'Filter by category', type: 'string', required: false }],
  async execute({ message, interaction }) {
    const embed = new EmbedBuilder().setTitle('📋 HELIX Catalog').setColor(0x00d2ff).addFields(
      { name: 'Templates', value: 'discord-bot, web-react, web-vue, desktop-tauri, desktop-electron, mobile-flutter, mobile-react-native, game-unity, game-godot, game-rpgm, game-renpy, backend-rust, backend-go, backend-python' },
    ).setTimestamp();
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
