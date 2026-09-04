import { GuildMember, User } from 'discord.js';
import { createEmbed } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const userinfo: CommandDefinition = {
  name: 'userinfo',
  description: 'Display user information',
  category: 'utility',
  options: [{ name: 'user', description: 'Target user', type: 'user', required: false }],
  async execute({ message, interaction, getOption, guild }) {
    const raw = getOption<GuildMember | User>('user');
    const target = raw ? (raw instanceof GuildMember ? raw.user : raw) : (message?.author || interaction!.user);
    const member = guild?.members.cache.get(target.id);

    const roles = member
      ? member.roles.cache.filter(r => r.id !== guild.id).map(r => `<@&${r.id}>`).join(', ') || 'None'
      : 'N/A';

    const embed = createEmbed('utility.userinfo.embed', {
      username: target.tag,
      id: target.id,
      createdAt: target.createdAt.toLocaleDateString(),
      joinedAt: member?.joinedAt ? member.joinedAt.toLocaleDateString() : 'N/A',
      roleCount: member ? member.roles.cache.size - 1 : 0,
      roles,
    });

    embed.setThumbnail(target.displayAvatarURL({ size: 256 }));

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
