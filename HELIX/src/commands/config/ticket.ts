import { PermissionFlagsBits, ChannelType, ThreadChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { botSettings } from '../../handlers/settings-manager.js';
import { createTicketsHubEmbed } from '../../interactions/tickets.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const ticket: CommandDefinition = {
  name: 'ticket',
  description: 'Support ticket system',
  category: 'config',
  usage: '<create|close|setup-hub|add|remove|transcript> [args]',
  examples: ['ticket setup-hub #support', 'ticket create "Billing inquiry"', 'ticket close "Resolved"', 'ticket add @user', 'ticket transcript'],
  subcommands: [
    { name: 'create', description: 'Create a support ticket', options: [
      { name: 'subject', description: 'Topic', type: 'string', required: true },
      { name: 'details', description: 'Additional details', type: 'string', required: false },
    ]},
    { name: 'close', description: 'Close the current ticket', options: [
      { name: 'reason', description: 'Reason', type: 'string', required: false },
    ]},
    { name: 'setup-hub', description: 'Deploy the ticket hub embed', options: [
      { name: 'channel', description: 'Target channel', type: 'channel', required: false },
    ]},
    { name: 'add', description: 'Add user to ticket', options: [{ name: 'user', description: 'User', type: 'user', required: true }] },
    { name: 'remove', description: 'Remove user from ticket', options: [{ name: 'user', description: 'User', type: 'user', required: true }] },
    { name: 'transcript', description: 'Generate ticket transcript' },
  ],
  async execute({ message, interaction, guild, user }) {
    const db = BotDatabase.getInstance();

    if (interaction) {
      const sub = interaction.options.getSubcommand();

      if (sub === 'setup-hub') {
        const member = interaction.member as any;
        if (!member?.permissions?.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ embeds: [formatError('permission_denied')], ephemeral: true });
        const ch = interaction.options.getChannel('channel') || interaction.channel;
        if (!ch || !('send' in ch)) return interaction.reply({ embeds: [formatError('invalid_channel', { input: 'channel' })], ephemeral: true });
        await (ch as any).send(createTicketsHubEmbed());
        botSettings.setGuildSettings({ guildId: guild.id, ticketsHubChannelId: ch.id });
        return interaction.reply({ content: `✅ Hub deployed in <#${ch.id}>!`, ephemeral: true });
      }

      if (sub === 'create') {
        const subject = interaction.options.getString('subject', true);
        const details = interaction.options.getString('details') || '';
        const active = db.getUserActiveTicket(guild.id, user.id);
        if (active) return interaction.reply({ embeds: [formatError(`You already have an active ticket: <#${active.threadId}>`)], ephemeral: true });

        const settings = botSettings.getGuildSettings(guild.id);
        let targetCh: any = interaction.channel;
        if (settings?.ticketsHubChannelId) { try { const h = await guild.channels.fetch(settings.ticketsHubChannelId); if (h?.isTextBased()) targetCh = h; } catch {} }
        if (!targetCh?.isTextBased() || targetCh.isThread()) return interaction.reply({ embeds: [formatError('Cannot create ticket in this channel.')], ephemeral: true });

        const clean = user.username.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toLowerCase() || 'user';
        let thread: ThreadChannel;
        try { thread = await targetCh.threads.create({ name: `ticket-${clean}-${Date.now().toString().slice(-4)}`, autoArchiveDuration: 10080, type: ChannelType.PrivateThread }); }
        catch { thread = await targetCh.threads.create({ name: `ticket-${clean}-${Date.now().toString().slice(-4)}`, autoArchiveDuration: 10080, type: ChannelType.PublicThread }); }

        try { await thread.members.add(user.id); } catch {}
        const mgr = settings?.ticketManagerRoleId ? `<@&${settings.ticketManagerRoleId}>` : 'Support Team';
        const embed = createEmbed('config.ticket.welcome_embed', {
          subject,
          userId: user.id,
          staffMention: mgr,
        });
        if (details) embed.addFields({ name: 'Details', value: details });

        const btn = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('helix_ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
        await thread.send({ content: `<@${user.id}> ${mgr}`, embeds: [embed], components: [btn] });
        db.createTicket({ guildId: guild.id, channelId: targetCh.id, threadId: thread.id, userId: user.id, subject });
        return interaction.reply({ content: `✅ Ticket opened: <#${thread.id}>`, ephemeral: true });
      }

      if (sub === 'close') {
        if (!interaction.channel?.isThread()) return interaction.reply({ embeds: [formatError('Use this command inside a ticket thread.')], ephemeral: true });
        const reason = interaction.options.getString('reason') || 'Resolved';
        db.closeTicket(interaction.channel.id, user.id);
        const embed = createEmbed('config.ticket.closed_embed', { closedBy: user.id });
        await interaction.reply({ embeds: [embed] });
        try { await (interaction.channel as ThreadChannel).setLocked(true, reason); await (interaction.channel as ThreadChannel).setArchived(true, reason); } catch {}
        return;
      }

      if (sub === 'add' || sub === 'remove') {
        if (!interaction.channel?.isThread()) return interaction.reply({ embeds: [formatError('Use this command inside a ticket thread.')], ephemeral: true });
        const target = interaction.options.getUser('user', true);
        try {
          if (sub === 'add') await (interaction.channel as ThreadChannel).members.add(target.id);
          else await (interaction.channel as ThreadChannel).members.remove(target.id);
          return interaction.reply({ content: `✅ ${sub === 'add' ? 'Added' : 'Removed'} <@${target.id}>.` });
        } catch (err: any) { return interaction.reply({ embeds: [formatError(`Failed: ${err.message}`)], ephemeral: true }); }
      }

      if (sub === 'transcript') {
        if (!interaction.channel?.isThread()) return interaction.reply({ embeds: [formatError('Use this command inside a ticket thread.')], ephemeral: true });
        await interaction.deferReply();
        const thread = interaction.channel as ThreadChannel;
        const messages = await thread.messages.fetch({ limit: 100 });
        const sorted = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        let txt = `# Transcript: ${thread.name}\nGenerated: ${new Date().toUTCString()}\n\n---\n\n`;
        for (const m of sorted) { txt += `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}:\n${m.content}\n\n`; }
        const att = new AttachmentBuilder(Buffer.from(txt, 'utf-8'), { name: `${thread.name}-transcript.md` });
        return interaction.editReply({ content: `📄 Transcript (${sorted.length} messages):`, files: [att] });
      }
      return;
    }

    // Prefix: >ticket create "subject" | >ticket close | >ticket setup-hub #channel
    const args = message!.content.split(/\s+/);
    const sub = args[1]?.toLowerCase();
    if (sub === 'setup-hub') {
      const member = message!.member;
      if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) return message!.reply({ embeds: [formatError('permission_denied')] });
      const ch = message!.mentions.channels.first() || message!.channel;
      if (!('send' in ch)) return message!.reply({ embeds: [formatError('invalid_channel', { input: 'channel' })] });
      await (ch as any).send(createTicketsHubEmbed());
      botSettings.setGuildSettings({ guildId: guild.id, ticketsHubChannelId: ch.id });
      return message!.reply(`✅ Hub deployed in <#${ch.id}>!`);
    }
    return message!.reply({ embeds: [formatError('subcommand_not_found')] });
  },
};
