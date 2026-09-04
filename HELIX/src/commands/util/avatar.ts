import { EmbedBuilder, User } from 'discord.js';
import type { CommandDefinition } from '../../types/command.js';

export const avatar: CommandDefinition = {
  name: 'avatar', description: 'Get a user\'s avatar', category: 'utility',
  options: [{ name: 'user', description: 'Target user', type: 'user', required: false }],
  async execute({ message, interaction, getOption }) {
    const target = getOption<User>('user') || message?.author || interaction!.user;
    const embed = new EmbedBuilder().setTitle(`${target.username}'s Avatar`).setColor(0x00d2ff).setImage(target.displayAvatarURL({ size: 512, extension: 'png' })).setTimestamp();
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
