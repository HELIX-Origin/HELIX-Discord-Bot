import { EmbedBuilder } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import type { CommandDefinition } from '../../types/command.js';

export const warn: CommandDefinition = {
  name: 'warn', description: 'Manage server warnings',
  category: 'moderation', permissions: ['32' as any],
  subcommands: [
    { name: 'user', description: 'Warn a user', options: [
      { name: 'user', description: 'Target user', type: 'user', required: true },
      { name: 'reason', description: 'Reason', type: 'string', required: false },
    ]},
    { name: 'list', description: 'View your warnings' },
    { name: 'clear', description: 'Clear your warnings' },
  ],
  async execute({ message, interaction, guild, user }) {
    const db = BotDatabase.getInstance();

    if (interaction) {
      const sub = interaction.options.getSubcommand();
      if (sub === 'user') {
        const target = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        db.addWarning({ guildId: guild.id, userId: target.id, moderatorId: user.id, reason });
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('⚠️ Warned').setColor(0xffaa00).addFields({ name: 'Target', value: `<@${target.id}>` }, { name: 'Reason', value: reason }).setTimestamp()] });
      }
      if (sub === 'list') {
        const warnings = db.getWarnings(guild.id, user.id);
        if (!warnings.length) return interaction.reply({ content: '✅ No warnings.', ephemeral: true });
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('⚠️ Warnings').setColor(0xffaa00).setDescription(warnings.map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderatorId}>`).join('\n')).setTimestamp()], ephemeral: true });
      }
      if (sub === 'clear') {
        db.clearWarnings(guild.id, user.id);
        return interaction.reply({ content: '✅ Warnings cleared.', ephemeral: true });
      }
      return;
    }

    const args = message!.content.split(/\s+/);
    const sub = args[1]?.toLowerCase();
    if (sub === 'list') {
      const warnings = db.getWarnings(guild.id, user.id);
      if (!warnings.length) return message!.reply('✅ No warnings.');
      return message!.reply({ embeds: [new EmbedBuilder().setTitle('⚠️ Warnings').setColor(0xffaa00).setDescription(warnings.map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderatorId}>`).join('\n')).setTimestamp()] });
    }
    if (sub === 'clear') {
      db.clearWarnings(guild.id, user.id);
      return message!.reply('✅ Warnings cleared.');
    }
    if (sub === 'user') {
      const target = message!.mentions?.users?.first();
      if (!target) return message!.reply('❌ Usage: `>warn user @user [reason]`');
      const reason = args.slice(3).join(' ') || 'No reason provided';
      db.addWarning({ guildId: guild.id, userId: target.id, moderatorId: user.id, reason });
      return message!.reply({ embeds: [new EmbedBuilder().setTitle('⚠️ Warned').setColor(0xffaa00).addFields({ name: 'Target', value: `<@${target.id}>` }, { name: 'Reason', value: reason }).setTimestamp()] });
    }
    return message!.reply('❌ Usage: `>warn <user|list|clear>`');
  },
};
