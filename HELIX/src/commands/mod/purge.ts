import { PermissionFlagsBits } from 'discord.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import { sendModLog } from '../../handlers/mod-log-handler.js';
import { BotDatabase } from '../../db/database.js';
import type { CommandDefinition } from '../../types/command.js';

export const purge: CommandDefinition = {
  name: 'purge',
  description: 'Bulk delete messages from the current channel',
  category: 'moderation',
  usage: '<amount>',
  examples: ['purge 25', 'purge 50', 'purge 100'],
  permissions: [PermissionFlagsBits.ManageMessages],
  options: [
    { name: 'amount', description: 'Number of messages to delete (1-100)', type: 'integer', required: true, minValue: 1, maxValue: 100 },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const channel = message?.channel || interaction?.channel;
    const amount = getOption<number>('amount') || 10;
    const modUser = message?.author || interaction!.user;

    if (!channel || channel.isDMBased() || !guild) {
      const err = formatError(getMessage('errors.guild_only'));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    try {
      const deleted = await (channel as any).bulkDelete(amount, true);
      BotDatabase.getInstance().logModeration({
        guildId: guild.id,
        userId: 'channel-' + channel.id,
        moderatorId: modUser.id,
        action: 'purge',
        reason: `Purged ${deleted.size} message(s) in #${(channel as any).name || channel.id}`,
      });

      await sendModLog({
        guild,
        action: 'purge',
        target: { id: channel.id, tag: `Channel <#${channel.id}>` },
        moderator: modUser,
        reason: `Bulk deleted ${deleted.size} messages`,
        count: deleted.size,
      });

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
