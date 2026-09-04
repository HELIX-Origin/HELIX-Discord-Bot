import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const purge: CommandDefinition = {
  name: 'purge',
  description: 'Bulk delete messages from the current channel',
  category: 'moderation',
  permissions: ['8192' as any],
  options: [
    { name: 'amount', description: 'Number of messages to delete (1-100)', type: 'integer', required: true, minValue: 1, maxValue: 100 },
  ],
  async execute({ message, interaction, getOption }) {
    const channel = message?.channel || interaction?.channel;
    const amount = getOption<number>('amount') || 10;
    if (!channel || channel.isDMBased()) {
      const err = formatError(getMessage('errors.guild_only'));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    try {
      const deleted = await (channel as any).bulkDelete(amount, true);
      const embed = createEmbed('moderation.purge.embed', {
        count: deleted.size,
        channel: `<#${channel.id}>`,
      });

      if (message) {
        const reply = await message.reply({ embeds: [embed] });
        setTimeout(() => reply.delete().catch(() => {}), 5000);
      } else {
        await interaction!.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (err: any) {
      const errorEmbed = formatError(getMessage('moderation.purge.failed', { reason: err.message }));
      if (message) await message.reply({ embeds: [errorEmbed] });
      else await interaction!.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
