import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import { sendModLog } from '../../handlers/mod-log-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const untimeout: CommandDefinition = {
  name: 'untimeout',
  description: 'Remove timeout from a member',
  category: 'moderation',
  permissions: [PermissionFlagsBits.ModerateMembers],
  options: [
    { name: 'user', description: 'Target user', type: 'user', required: true },
    { name: 'reason', description: 'Reason', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const target = getOption<GuildMember>('user');
    const reason = getOption<string>('reason') || 'No reason provided';
    const modUser = message?.author || interaction!.user;

    if (!target) {
      const err = formatError(getMessage('errors.invalid_user', { input: 'user' }));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    await target.timeout(null, reason);
    BotDatabase.getInstance().logModeration({
      guildId: guild.id,
      userId: target.id,
      moderatorId: modUser.id,
      action: 'untimeout',
      reason,
    });

    await sendModLog({
      guild,
      action: 'untimeout',
      target: target.user,
      moderator: modUser,
      reason,
    });

    const embed = createEmbed('moderation.untimeout.embed', {
      target: target.user.tag,
      reason,
    });

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
