import { EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../types/command.js';

export const scaffold: CommandDefinition = {
  name: 'scaffold', description: 'Preview scaffolding for a new project', category: 'project',
  options: [
    { name: 'type', description: 'Project type', type: 'string', required: true },
    { name: 'name', description: 'Project name', type: 'string', required: true },
  ],
  async execute({ message, interaction, getOption }) {
    const type = getOption<string>('type');
    const name = getOption<string>('name');
    if (!type || !name) { const r = '❌ Type and name required.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    const embed = new EmbedBuilder().setTitle('🔍 Scaffold Preview').setColor(0x00d2ff)
      .setDescription(`Preview for **${name}** using \`${type}\`.\nUse \`>create\` or \`/create\` to generate the project.`)
      .setTimestamp();
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
