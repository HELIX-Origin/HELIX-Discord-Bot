import { createEmbed, formatError } from '../../handlers/message-handler.js';
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
    if (!type || !name) {
      const errEmbed = formatError('missing_argument', { arg: 'type, name' });
      if (message) return message.reply({ embeds: [errEmbed] });
      return interaction!.reply({ embeds: [errEmbed], ephemeral: true });
    }

    const previewTree = `${name}/\n├── package.json\n├── src/\n│   └── index.ts\n├── README.md\n└── tsconfig.json`;
    const embed = createEmbed('project.scaffold.embed', {
      type,
      name,
      tree: previewTree,
    });
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
