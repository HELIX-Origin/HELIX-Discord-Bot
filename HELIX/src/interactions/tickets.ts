import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ThreadChannel,
  PermissionFlagsBits,
} from 'discord.js';
import { BotDatabase } from '../db/database.js';
import { createEmbed, formatError, getMessage } from '../handlers/message-handler.js';

export function createTicketsHubEmbed() {
  const embed = createEmbed('config.ticket.hub_embed');

  const button = new ButtonBuilder()
    .setCustomId('helix_ticket_create')
    .setLabel('Create Ticket')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🎫');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  return { embeds: [embed], components: [row] };
}

export async function handleTicketButton(interaction: ButtonInteraction): Promise<void> {
  const db = BotDatabase.getInstance();

  if (interaction.customId === 'helix_ticket_create') {
    const modal = new ModalBuilder()
      .setCustomId('helix_ticket_modal')
      .setTitle('Open a Support Ticket');

    const subjectInput = new TextInputBuilder()
      .setCustomId('ticket_subject')
      .setLabel('Topic / Subject')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Brief summary of your question or issue...')
      .setRequired(true)
      .setMaxLength(100);

    const detailsInput = new TextInputBuilder()
      .setCustomId('ticket_details')
      .setLabel('Details (Optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Provide any relevant details, error logs, or context...')
      .setRequired(false)
      .setMaxLength(1000);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(subjectInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(detailsInput);

    modal.addComponents(row1, row2);
    await interaction.showModal(modal);
    return;
  }

  if (interaction.customId === 'helix_ticket_close') {
    if (!interaction.channel || !interaction.channel.isThread()) {
      await interaction.reply({ embeds: [formatError('This action can only be performed inside a ticket thread.')], ephemeral: true });
      return;
    }

    const thread = interaction.channel as ThreadChannel;
    const ticket = db.getTicketByThread(thread.id);
    const settings = interaction.guildId ? db.getGuildSettings(interaction.guildId) : null;

    const member = interaction.member as any;
    const isOwner = ticket && ticket.userId === interaction.user.id;
    const hasPerm = member?.permissions?.has(PermissionFlagsBits.ManageThreads) || member?.permissions?.has(PermissionFlagsBits.Administrator);
    const hasRole = settings?.ticketManagerRoleId && member?.roles?.cache?.has(settings.ticketManagerRoleId);

    if (!isOwner && !hasPerm && !hasRole) {
      await interaction.reply({ embeds: [formatError('permission_denied')], ephemeral: true });
      return;
    }

    db.closeTicket(thread.id, interaction.user.id);

    const closeEmbed = createEmbed('config.ticket.closed_embed', {
      closedBy: interaction.user.id,
    });

    await interaction.reply({ embeds: [closeEmbed] });

    try {
      await thread.setLocked(true, `Closed by ${interaction.user.tag}`);
      await thread.setArchived(true, `Closed by ${interaction.user.tag}`);
    } catch {
      // Ignore thread lock errors
    }
  }
}

export async function handleTicketModal(interaction: ModalSubmitInteraction): Promise<void> {
  const db = BotDatabase.getInstance();

  if (interaction.customId === 'helix_ticket_modal') {
    const subject = interaction.fields.getTextInputValue('ticket_subject').trim();
    const details = interaction.fields.getTextInputValue('ticket_details')?.trim() || '';

    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      await interaction.editReply({ embeds: [formatError('guild_only')] });
      return;
    }

    const activeTicket = db.getUserActiveTicket(interaction.guild.id, interaction.user.id);
    if (activeTicket) {
      await interaction.editReply({
        embeds: [formatError(`You already have an active open ticket in this server: <#${activeTicket.threadId}>. Please use or close it first.`)],
      });
      return;
    }

    const settings = db.getGuildSettings(interaction.guild.id);
    let targetChannel = interaction.channel;

    if (settings?.ticketsHubChannelId) {
      try {
        const hub = await interaction.guild.channels.fetch(settings.ticketsHubChannelId);
        if (hub && hub.isTextBased()) {
          targetChannel = hub as any;
        }
      } catch {
        // Fallback to interaction.channel
      }
    }

    if (!targetChannel || !targetChannel.isTextBased() || targetChannel.isThread()) {
      await interaction.editReply({ embeds: [formatError('Unable to create a ticket thread in this channel.')] });
      return;
    }

    const cleanUsername = interaction.user.username.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toLowerCase() || 'user';
    const threadName = `ticket-${cleanUsername}-${Date.now().toString().slice(-4)}`;

    let thread: ThreadChannel;
    try {
      thread = await (targetChannel as any).threads.create({
        name: threadName,
        autoArchiveDuration: 10080,
        type: ChannelType.PrivateThread,
        reason: `Support ticket created by ${interaction.user.tag}`,
      });
    } catch {
      try {
        thread = await (targetChannel as any).threads.create({
          name: threadName,
          autoArchiveDuration: 10080,
          type: ChannelType.PublicThread,
          reason: `Support ticket created by ${interaction.user.tag}`,
        });
      } catch (err: any) {
        await interaction.editReply({ embeds: [formatError(`Failed to create ticket thread: ${err.message}`)] });
        return;
      }
    }

    try {
      await thread.members.add(interaction.user.id);
    } catch {}

    const managerMention = settings?.ticketManagerRoleId ? `<@&${settings.ticketManagerRoleId}>` : 'Support Staff';

    const welcomeEmbed = createEmbed('config.ticket.welcome_embed', {
      subject,
      userId: interaction.user.id,
      staffMention: managerMention,
    });

    if (details) {
      welcomeEmbed.addFields({ name: 'Details', value: details, inline: false });
    }

    const closeBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('helix_ticket_close')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    await thread.send({
      content: `<@${interaction.user.id}> ${managerMention}`,
      embeds: [welcomeEmbed],
      components: [closeBtn],
    });

    db.createTicket({
      guildId: interaction.guild.id,
      channelId: (targetChannel as any).id,
      threadId: thread.id,
      userId: interaction.user.id,
      subject,
    });

    await interaction.editReply({
      content: `✅ Your ticket has been opened: <#${thread.id}>`,
    });
  }
}
