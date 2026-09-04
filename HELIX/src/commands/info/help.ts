import { EmbedBuilder } from 'discord.js';
import { getAllHelp, getCategoryEmoji, getCategoryLabel } from '../../handlers/help-registrar.js';
import { getPrefixForGuild } from '../../handlers/command-handler.js';
import type { CommandDefinition } from '../../types/command.js';

const cats = ['moderation', 'utility', 'ai', 'info', 'project', 'config'] as const;

export const help: CommandDefinition = {
  name: 'help', description: 'Display all HELIX commands', category: 'info',
  async execute({ message, interaction, guild }) {
    const prefix = getPrefixForGuild(guild?.id || '');
    const entries = getAllHelp();
    const embed = new EmbedBuilder().setTitle('📖 HELIX Commands').setColor(0x00d2ff)
      .setDescription(`Use \`${prefix}<command>\` or \`/<command>\``)
      .setFooter({ text: `${entries.length} commands` }).setTimestamp();

    for (const cat of cats) {
      const cmds = entries.filter(h => h.category === cat);
      if (!cmds.length) continue;
      embed.addFields({ name: `${getCategoryEmoji(cat)} ${getCategoryLabel(cat)}`, value: cmds.map(c => `\`${prefix}${c.name}\` — ${c.description}`).join('\n') });
    }

    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
