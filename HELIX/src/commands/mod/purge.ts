import { EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../types/command.js';

export const purge: CommandDefinition = {
  name: 'purge', aliases: ['clear'], description: 'Bulk delete messages',
  category: 'moderation', permissions: ['8192' as any],
  options: [{ name: 'amount', description: 'Number of messages (1-100)', type: 'integer', required: true, minValue: 1, maxValue: 100 }],
  async execute({ message, interaction, getOption }) {
    const amount = getOption<number>('amount');
    if (!amount) { const r = '❌ Amount required.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    const channel = message?.channel || interaction?.channel;
    if (!channel || !('bulkDelete' in channel)) { const r = '❌ Invalid channel.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    try {
      const deleted = await (channel as any).bulkDelete(amount, true);
      const r = `✅ Deleted ${deleted.size} message(s).`;
      if (message) await message.reply(r); else await interaction!.reply(r);
    } catch (err: any) {
      if (message) await message.reply(`❌ Failed: ${err.message}`); else await interaction!.reply({ content: `❌ Failed: ${err.message}`, ephemeral: true });
    }
  },
};
