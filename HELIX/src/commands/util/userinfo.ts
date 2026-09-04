import { EmbedBuilder, User } from 'discord.js';
import type { CommandDefinition } from '../../types/command.js';

export const userinfo: CommandDefinition = {
  name: 'userinfo', aliases: ['whois', 'ui'], description: 'Display information about a user', category: 'utility',
  options: [{ name: 'user', description: 'Target user', type: 'user', required: false }],
  async execute({ message, interaction, getOption, guild }) {
    const target = getOption<User>('user') || message?.author || interaction!.user;
    const member = guild.members.cache.get(target.id);
    const embed = new EmbedBuilder().setTitle(target.username).setColor(0x00d2ff).setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields({ name: 'ID', value: target.id, inline: true }, { name: 'Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true }).setTimestamp();
    if (member) {
      embed.addFields({ name: 'Joined', value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`, inline: true },
        { name: 'Roles', value: member.roles.cache.filter(r => r.id !== guild.id).map(r => `<@&${r.id}>`).join(', ') || 'None', inline: false });
    }
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
