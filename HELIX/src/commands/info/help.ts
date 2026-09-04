import { getAllHelp, getCategoryEmoji, getCategoryLabel } from '../../handlers/help-registrar.js';
import { getPrefixForGuild } from '../../handlers/command-handler.js';
import { createEmbed } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

const cats = ['moderation', 'utility', 'plugins', 'info', 'project', 'config'] as const;

export const help: CommandDefinition = {
  name: 'help',
  description: 'Display all HELIX commands',
  category: 'info',
  async execute({ message, interaction, guild }) {
    const prefix = getPrefixForGuild(guild?.id || '');
    const entries = getAllHelp();

    const embed = createEmbed('info.help.embed', {
      prefix,
      count: entries.length,
      categories: cats.length,
    });

    for (const cat of cats) {
      const cmds = entries.filter(h => h.category === cat);
      if (!cmds.length) continue;
      embed.addFields({
        name: `${getCategoryEmoji(cat)} ${getCategoryLabel(cat)}`,
        value: cmds.map(c => `\`${prefix}${c.name}\` — ${c.description}`).join('\n'),
      });
    }

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
