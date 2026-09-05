import { SnowflakeUtil } from 'discord.js';
import { createEmbed, formatError } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const snowflake: CommandDefinition = {
  name: 'snowflake',
  description: 'Deconstruct a Discord snowflake ID',
  category: 'utility',
  usage: '<id>',
  examples: ['snowflake 123456789012345678'],
  options: [{ name: 'id', description: 'Snowflake ID', type: 'string', required: true }],
  async execute({ message, interaction, getOption }) {
    const id = getOption<string>('id');
    if (!id) {
      const err = formatError('Missing snowflake ID.');
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    try {
      const deconstructed = SnowflakeUtil.deconstruct(id);
      const date = new Date(Number(deconstructed.timestamp)).toUTCString();
      const embed = createEmbed('utility.snowflake.embed', {
        id,
        timestamp: date,
        workerId: deconstructed.workerId.toString(),
        processId: deconstructed.processId.toString(),
      });

      if (message) await message.reply({ embeds: [embed] });
      else await interaction!.reply({ embeds: [embed] });
    } catch {
      const err = formatError('Invalid snowflake ID.');
      if (message) await message.reply({ embeds: [err] });
      else await interaction!.reply({ embeds: [err], ephemeral: true });
    }
  },
};
