import { GuildMember, User } from 'discord.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const avatar: CommandDefinition = {
  name: 'avatar',
  description: 'Display a user avatar',
  category: 'utility',
  options: [{ name: 'user', description: 'Target user', type: 'user', required: false }],
  async execute({ message, interaction, getOption }) {
    const raw = getOption<GuildMember | User>('user');
    const target = raw ? (raw instanceof GuildMember ? raw.user : raw) : (message?.author || interaction!.user);
    const url = target.displayAvatarURL({ size: 1024 });

    const embed = createEmbed('utility.avatar.embed', {
      target: target.tag,
      url,
    });
    embed.setImage(url);

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
