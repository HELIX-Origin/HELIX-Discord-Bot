import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const serverinfo: CommandDefinition = {
  name: 'serverinfo',
  description: 'Display server information and statistics',
  category: 'utility',
  async execute({ message, interaction, guild }) {
    if (!guild) {
      const err = formatError(getMessage('errors.guild_only'));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    const embed = createEmbed('utility.serverinfo.embed', {
      name: guild.name,
      id: guild.id,
      ownerId: guild.ownerId,
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      roleCount: guild.roles.cache.size,
      createdAt: guild.createdAt.toLocaleDateString(),
    });

    if (guild.iconURL()) embed.setThumbnail(guild.iconURL()!);

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
