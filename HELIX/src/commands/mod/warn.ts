import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import { sendModLog } from '../../handlers/mod-log-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const warn: CommandDefinition = {
  name: 'warn',
  description: 'Issue, view, or clear member warnings',
  category: 'moderation',
  permissions: [PermissionFlagsBits.ModerateMembers],
  options: [
    { name: 'subcommand', description: 'Action (user, list, clear)', type: 'string', required: true, choices: [{ name: 'user', value: 'user' }, { name: 'list', value: 'list' }, { name: 'clear', value: 'clear' }] },
    { name: 'user', description: 'Target user', type: 'user', required: true },
    { name: 'reason', description: 'Reason for warning', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const sub = getOption<string>('subcommand') || 'user';
    const target = getOption<GuildMember>('user');
    const reason = getOption<string>('reason') || 'No reason provided';
    const modUser = message?.author || interaction!.user;
    const db = BotDatabase.getInstance();

    if (!target) {
      const err = formatError(getMessage('errors.invalid_user', { input: 'user' }));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    if (sub === 'user') {
      db.addWarning({
        guildId: guild.id,
        userId: target.id,
        moderatorId: modUser.id,
        reason,
      });

      await sendModLog({
        guild,
        action: 'warn',
        target: target.user,
        moderator: modUser,
        reason,
      });

      const embed = createEmbed('moderation.warn.warn_embed', {
        target: target.user.tag,
        moderatorId: modUser.id,
        reason,
      });

      if (message) await message.reply({ embeds: [embed] });
      else await interaction!.reply({ embeds: [embed] });
    } else if (sub === 'list') {
      const warnings = db.getWarnings(guild.id, target.id);
      if (!warnings.length) {
        const noWarnEmbed = createEmbed('moderation.warn.list_embed', {
          target: target.user.tag,
          warningsList: getMessage('moderation.warn.no_warnings', { target: target.user.tag }),
        });
        if (message) return message.reply({ embeds: [noWarnEmbed] });
        return interaction!.reply({ embeds: [noWarnEmbed] });
      }

      const formatted = warnings
        .map((w, i) => `**${i + 1}.** \`${w.timestamp || 'N/A'}\` — ${w.reason} *(by <@${w.moderatorId}>)*`)
        .join('\n');

      const embed = createEmbed('moderation.warn.list_embed', {
        target: target.user.tag,
        warningsList: formatted,
      });

      if (message) await message.reply({ embeds: [embed] });
      else await interaction!.reply({ embeds: [embed] });
    } else if (sub === 'clear') {
      const count = db.clearWarnings(guild.id, target.id);
      const embed = createEmbed('moderation.warn.clear_embed', {
        target: target.user.tag,
        count,
      });

      if (message) await message.reply({ embeds: [embed] });
      else await interaction!.reply({ embeds: [embed] });
    }
  },
};
