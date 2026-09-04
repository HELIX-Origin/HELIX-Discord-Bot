import { EmbedBuilder, GuildMember } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import type { CommandDefinition } from '../../types/command.js';

export const kick: CommandDefinition = {
  name: 'kick', aliases: ['k'], description: 'Kick a member from the server',
  category: 'moderation', permissions: ['64' as any],
  options: [
    { name: 'user', description: 'Target user', type: 'user', required: true },
    { name: 'reason', description: 'Reason', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption, guild }) {
    const target = getOption<GuildMember>('user');
    const reason = getOption<string>('reason') || 'No reason provided';
    if (!target) { const r = '❌ User not found.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }
    if (!target.kickable) { const r = '❌ I cannot kick this user.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    await target.kick(reason);
    BotDatabase.getInstance().logModeration({ guildId: guild.id, userId: target.id, moderatorId: message?.author.id || interaction!.user.id, action: 'kick', reason });
    const embed = new EmbedBuilder().setTitle('👢 Member Kicked').setColor(0xffaa00).addFields({ name: 'Target', value: target.user.tag, inline: true }, { name: 'Reason', value: reason }).setTimestamp();
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
