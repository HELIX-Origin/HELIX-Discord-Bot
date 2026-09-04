import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  GuildMember,
} from 'discord.js';
import { BotDatabase } from '../db/index.js';

export const modCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-mod')
    .setDescription('HELIX Moderation Suite - Kick, ban, timeout, purge, warn, and manage members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(opt => opt.setName('user').setDescription('Target member to kick').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the kick').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(opt => opt.setName('user').setDescription('Target member to ban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban').setRequired(false))
        .addIntegerOption(opt =>
          opt
            .setName('delete_days')
            .setDescription('Days of message history to delete (0-7)')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(7)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('unban')
        .setDescription('Unban a user by their Discord ID')
        .addStringOption(opt => opt.setName('user_id').setDescription('Discord User ID to unban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for unbanning').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('timeout')
        .setDescription('Temporarily timeout/mute a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target member to timeout').setRequired(true))
        .addIntegerOption(opt =>
          opt
            .setName('duration')
            .setDescription('Timeout duration in minutes (e.g. 5, 60, 1440)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(40320)
        )
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the timeout').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('untimeout')
        .setDescription('Remove timeout from a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target member to remove timeout from').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for removing timeout').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('purge')
        .setDescription('Bulk delete messages from the current channel (1-100)')
        .addIntegerOption(opt =>
          opt
            .setName('amount')
            .setDescription('Number of messages to delete')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('warn')
        .setDescription('Issue a formal warning to a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target member to warn').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('warnings')
        .setDescription('View formal warnings recorded for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('clear-warnings')
        .setDescription('Clear all recorded warnings for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    if (!interaction.guild) {
      await interaction.editReply({ content: '❌ Moderation commands can only be used within a server.' });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const db = BotDatabase.getInstance();
    const settings = db.getGuildSettings(interaction.guild.id);

    const sendModLog = async (logEmbed: EmbedBuilder) => {
      if (!settings?.modLogChannelId) return;
      try {
        const channel = await interaction.guild?.channels.fetch(settings.modLogChannelId);
        if (channel && channel.isTextBased()) {
          await (channel as any).send({ embeds: [logEmbed] });
        }
      } catch {}
    };

    if (subcommand === 'kick') {
      const targetUser = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const caller = interaction.member as GuildMember;

      if (!caller.permissions.has(PermissionFlagsBits.KickMembers)) {
        await interaction.editReply({ content: '❌ You do not have Kick Members permission.' });
        return;
      }

      let member: GuildMember | null = null;
      try {
        member = await interaction.guild.members.fetch(targetUser.id);
      } catch {
        await interaction.editReply({ content: '❌ Member not found in this server.' });
        return;
      }

      if (!member.kickable) {
        await interaction.editReply({ content: '❌ Cannot kick this member due to role hierarchy.' });
        return;
      }

      await member.kick(reason);
      db.logModeration({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        action: 'kick',
        reason,
      });

      const embed = new EmbedBuilder()
        .setTitle('👢 Member Kicked')
        .setColor(0xff9900)
        .addFields(
          { name: 'Target', value: `<@${targetUser.id}> (${targetUser.tag})`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(embed);
      return;
    }

    if (subcommand === 'ban') {
      const targetUser = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const deleteDays = interaction.options.getInteger('delete_days') || 0;
      const caller = interaction.member as GuildMember;

      if (!caller.permissions.has(PermissionFlagsBits.BanMembers)) {
        await interaction.editReply({ content: '❌ You do not have Ban Members permission.' });
        return;
      }

      try {
        await interaction.guild.members.ban(targetUser.id, {
          reason,
          deleteMessageSeconds: deleteDays * 86400,
        });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to ban member: ${err.message}` });
        return;
      }

      db.logModeration({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        action: 'ban',
        reason,
      });

      const embed = new EmbedBuilder()
        .setTitle('🔨 Member Banned')
        .setColor(0xff2222)
        .addFields(
          { name: 'Target', value: `<@${targetUser.id}> (${targetUser.tag})`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Delete History', value: `${deleteDays} day(s)`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(embed);
      return;
    }

    if (subcommand === 'unban') {
      const userId = interaction.options.getString('user_id', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const caller = interaction.member as GuildMember;

      if (!caller.permissions.has(PermissionFlagsBits.BanMembers)) {
        await interaction.editReply({ content: '❌ You do not have Ban Members permission.' });
        return;
      }

      try {
        await interaction.guild.members.unban(userId, reason);
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to unban user: ${err.message}` });
        return;
      }

      db.logModeration({
        guildId: interaction.guild.id,
        userId,
        moderatorId: interaction.user.id,
        action: 'unban',
        reason,
      });

      const embed = new EmbedBuilder()
        .setTitle('🕊️ User Unbanned')
        .setColor(0x00ff88)
        .addFields(
          { name: 'User ID', value: `\`${userId}\``, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(embed);
      return;
    }

    if (subcommand === 'timeout') {
      const targetUser = interaction.options.getUser('user', true);
      const duration = interaction.options.getInteger('duration', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';

      let member: GuildMember | null = null;
      try {
        member = await interaction.guild.members.fetch(targetUser.id);
      } catch {
        await interaction.editReply({ content: '❌ Member not found in this server.' });
        return;
      }

      try {
        await member.timeout(duration * 60 * 1000, reason);
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to timeout member: ${err.message}` });
        return;
      }

      db.logModeration({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        action: 'timeout',
        reason,
        durationMinutes: duration,
      });

      const embed = new EmbedBuilder()
        .setTitle('⏳ Member Timed Out')
        .setColor(0xffbb00)
        .addFields(
          { name: 'Target', value: `<@${targetUser.id}> (${targetUser.tag})`, inline: true },
          { name: 'Duration', value: `${duration} minute(s)`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(embed);
      return;
    }

    if (subcommand === 'untimeout') {
      const targetUser = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';

      let member: GuildMember | null = null;
      try {
        member = await interaction.guild.members.fetch(targetUser.id);
      } catch {
        await interaction.editReply({ content: '❌ Member not found in this server.' });
        return;
      }

      try {
        await member.timeout(null, reason);
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to remove timeout: ${err.message}` });
        return;
      }

      db.logModeration({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        action: 'untimeout',
        reason,
      });

      const embed = new EmbedBuilder()
        .setTitle('🔊 Timeout Removed')
        .setColor(0x00ff88)
        .addFields(
          { name: 'Target', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(embed);
      return;
    }

    if (subcommand === 'purge') {
      const amount = interaction.options.getInteger('amount', true);
      const caller = interaction.member as GuildMember;

      if (!caller.permissions.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.editReply({ content: '❌ You do not have Manage Messages permission.' });
        return;
      }

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) {
        await interaction.editReply({ content: '❌ Cannot purge messages in this channel.' });
        return;
      }

      try {
        const deleted = await (channel as any).bulkDelete(amount, true);
        db.logModeration({
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          moderatorId: interaction.user.id,
          action: 'purge',
          reason: `Bulk deleted ${deleted.size} messages`,
        });

        const embed = new EmbedBuilder()
          .setTitle('🧹 Messages Purged')
          .setColor(0x38bdf8)
          .setDescription(`Successfully deleted **${deleted.size}** messages.`)
          .setFooter({ text: 'Messages older than 14 days cannot be bulk deleted by Discord.' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        await sendModLog(embed);
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to purge messages: ${err.message}` });
      }
      return;
    }

    if (subcommand === 'warn') {
      const targetUser = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason', true);

      const warnId = db.addWarning({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason,
      });

      db.logModeration({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        action: 'warn',
        reason,
      });

      const totalWarnings = db.getWarnings(interaction.guild.id, targetUser.id).length;

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Member Warned')
        .setColor(0xffcc00)
        .addFields(
          { name: 'Target', value: `<@${targetUser.id}> (${targetUser.tag})`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Total Warnings', value: `${totalWarnings}`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: `Warning ID: #${warnId || '0'}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(embed);
      return;
    }

    if (subcommand === 'warnings') {
      const targetUser = interaction.options.getUser('user', true);
      const warnings = db.getWarnings(interaction.guild.id, targetUser.id);

      const embed = new EmbedBuilder()
        .setTitle(`⚠️ Warnings for ${targetUser.username}`)
        .setColor(warnings.length > 0 ? 0xffbb00 : 0x00ff88)
        .setDescription(
          warnings.length > 0
            ? warnings
                .map((w, idx) => `**#${idx + 1}** • ${w.reason} *(by <@${w.moderatorId}> at ${w.timestamp})*`)
                .join('\n')
            : 'No warnings on record for this member.'
        )
        .setFooter({ text: `Total: ${warnings.length} warning(s)` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'clear-warnings') {
      const targetUser = interaction.options.getUser('user', true);
      const caller = interaction.member as GuildMember;

      if (!caller.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.editReply({ content: '❌ You do not have permission to clear warnings.' });
        return;
      }

      const cleared = db.clearWarnings(interaction.guild.id, targetUser.id);

      const embed = new EmbedBuilder()
        .setTitle('🧹 Warnings Cleared')
        .setColor(0x00ff88)
        .setDescription(`Cleared **${cleared}** warning(s) for <@${targetUser.id}>.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  },
};
