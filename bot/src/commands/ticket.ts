import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ThreadChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from 'discord.js';
import { BotDatabase } from '../db/index.js';
import { createTicketsHubEmbed } from '../interactions/tickets.js';

export const ticketCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-ticket')
    .setDescription('HELIX Support & Ticket Management - Create, manage, and close thread tickets')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a new private support ticket thread')
        .addStringOption(opt => opt.setName('subject').setDescription('Topic or summary of your request').setRequired(true))
        .addStringOption(opt => opt.setName('details').setDescription('Additional details or context').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('close')
        .setDescription('Close and archive the current ticket thread')
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for closing').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('setup-hub')
        .setDescription('Deploy the persistent Ticket Hub embed and button in a channel')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Target text channel (defaults to current channel)')
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Add a user to the current ticket thread')
        .addUserOption(opt => opt.setName('user').setDescription('User to add').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a user from the current ticket thread')
        .addUserOption(opt => opt.setName('user').setDescription('User to remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('transcript')
        .setDescription('Generate and download a transcript of this ticket thread')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const db = BotDatabase.getInstance();

    if (!interaction.guild) {
      await interaction.reply({ content: '❌ Ticket commands must be used within a server.', ephemeral: true });
      return;
    }

    if (subcommand === 'setup-hub') {
      await interaction.deferReply({ ephemeral: true });
      const member = interaction.member as any;

      if (!member?.permissions?.has(PermissionFlagsBits.ManageGuild) && !member?.permissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.editReply({ content: '❌ You need Manage Server or Administrator permission to set up the ticket hub.' });
        return;
      }

      const targetChannel = (interaction.options.getChannel('channel') || interaction.channel) as any;
      if (!targetChannel || !targetChannel.isTextBased() || targetChannel.isThread()) {
        await interaction.editReply({ content: '❌ Target channel must be a standard text channel.' });
        return;
      }

      const hubData = createTicketsHubEmbed();
      await targetChannel.send(hubData);

      db.setGuildSettings({
        guildId: interaction.guild.id,
        ticketsHubChannelId: targetChannel.id,
      });

      await interaction.editReply({
        content: `✅ Tickets Hub deployed successfully in <#${targetChannel.id}> and saved to server configuration!`,
      });
      return;
    }

    if (subcommand === 'create') {
      await interaction.deferReply({ ephemeral: true });
      const subject = interaction.options.getString('subject', true);
      const details = interaction.options.getString('details') || '';

      const activeTicket = db.getUserActiveTicket(interaction.guild.id, interaction.user.id);
      if (activeTicket) {
        await interaction.editReply({
          content: `❌ You already have an active open ticket in this server: <#${activeTicket.threadId}>. Please resolve or close it before opening a new one.`,
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
        } catch {}
      }

      if (!targetChannel || !targetChannel.isTextBased() || targetChannel.isThread()) {
        await interaction.editReply({ content: '❌ Unable to create a ticket thread in this channel.' });
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
          reason: `Ticket created by ${interaction.user.tag}`,
        });
      } catch {
        try {
          thread = await (targetChannel as any).threads.create({
            name: threadName,
            autoArchiveDuration: 10080,
            type: ChannelType.PublicThread,
            reason: `Ticket created by ${interaction.user.tag}`,
          });
        } catch (err: any) {
          await interaction.editReply({ content: `❌ Failed to create ticket thread: ${err.message}` });
          return;
        }
      }

      try {
        await thread.members.add(interaction.user.id);
      } catch {}

      const managerMention = settings?.ticketManagerRoleId ? `<@&${settings.ticketManagerRoleId}>` : 'Support Team';

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🎫 Ticket: ${subject}`)
        .setDescription(
          `Welcome <@${interaction.user.id}>! ${managerMention} will be with you shortly.\n\nPlease explain your inquiry. Click **Close Ticket** when resolved.`
        )
        .setColor(0x00d2ff)
        .addFields(
          { name: 'Opened By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Topic', value: subject, inline: true }
        )
        .setFooter({ text: 'HELIX Support System' })
        .setTimestamp();

      if (details) {
        welcomeEmbed.addFields({ name: 'Details', value: details, inline: false });
      }

      const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('helix_ticket_close')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await thread.send({
        content: `<@${interaction.user.id}> ${managerMention}`,
        embeds: [welcomeEmbed],
        components: [closeRow],
      });

      db.createTicket({
        guildId: interaction.guild.id,
        channelId: (targetChannel as any).id,
        threadId: thread.id,
        userId: interaction.user.id,
        subject,
      });

      await interaction.editReply({ content: `✅ Your ticket has been opened: <#${thread.id}>` });
      return;
    }

    if (subcommand === 'close') {
      await interaction.deferReply();
      if (!interaction.channel || !interaction.channel.isThread()) {
        await interaction.editReply({ content: '❌ This command can only be used inside a ticket thread.' });
        return;
      }

      const thread = interaction.channel as ThreadChannel;
      const reason = interaction.options.getString('reason') || 'Resolved';
      db.closeTicket(thread.id, interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('🔒 Ticket Closed')
        .setDescription(`Ticket closed by <@${interaction.user.id}>.\n**Reason**: ${reason}`)
        .setColor(0xff4444)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      try {
        await thread.setLocked(true, reason);
        await thread.setArchived(true, reason);
      } catch {}
      return;
    }

    if (subcommand === 'add') {
      await interaction.deferReply();
      if (!interaction.channel || !interaction.channel.isThread()) {
        await interaction.editReply({ content: '❌ This command can only be used inside a ticket thread.' });
        return;
      }

      const targetUser = interaction.options.getUser('user', true);
      const thread = interaction.channel as ThreadChannel;

      try {
        await thread.members.add(targetUser.id);
        await interaction.editReply({ content: `✅ Added <@${targetUser.id}> to this ticket thread.` });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to add user: ${err.message}` });
      }
      return;
    }

    if (subcommand === 'remove') {
      await interaction.deferReply();
      if (!interaction.channel || !interaction.channel.isThread()) {
        await interaction.editReply({ content: '❌ This command can only be used inside a ticket thread.' });
        return;
      }

      const targetUser = interaction.options.getUser('user', true);
      const thread = interaction.channel as ThreadChannel;

      try {
        await thread.members.remove(targetUser.id);
        await interaction.editReply({ content: `✅ Removed <@${targetUser.id}> from this ticket thread.` });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to remove user: ${err.message}` });
      }
      return;
    }

    if (subcommand === 'transcript') {
      await interaction.deferReply();
      if (!interaction.channel || !interaction.channel.isThread()) {
        await interaction.editReply({ content: '❌ Transcripts can only be generated from ticket threads.' });
        return;
      }

      const thread = interaction.channel as ThreadChannel;
      const messages = await thread.messages.fetch({ limit: 100 });
      const sorted = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      let transcript = `# Ticket Transcript: ${thread.name}\n`;
      transcript += `Generated at: ${new Date().toUTCString()}\n\n---\n\n`;

      for (const msg of sorted) {
        transcript += `[${new Date(msg.createdTimestamp).toISOString()}] ${msg.author.tag} (${msg.author.id}):\n`;
        if (msg.content) transcript += `${msg.content}\n`;
        if (msg.attachments.size > 0) {
          transcript += `Attachments: ${msg.attachments.map(a => a.url).join(', ')}\n`;
        }
        transcript += '\n';
      }

      const buffer = Buffer.from(transcript, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, { name: `${thread.name}-transcript.md` });

      await interaction.editReply({
        content: `📄 Transcript generated for <#${thread.id}> (${sorted.length} messages):`,
        files: [attachment],
      });
      return;
    }
  },
};
