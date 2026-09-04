import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  GuildMember,
} from 'discord.js';
import { BotDatabase } from '../db/index.js';

export const setCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-set')
    .setDescription('Unified HELIX configuration suite for all guild and user settings')
    .addSubcommandGroup(group =>
      group
        .setName('guild')
        .setDescription('Configure server-wide channels, roles, and preferences')
        .addSubcommand(sub =>
          sub
            .setName('tickets-hub')
            .setDescription('Set the channel where ticket creation panels and threads live')
            .addChannelOption(opt =>
              opt
                .setName('channel')
                .setDescription('Target text channel')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('ticket-manager-role')
            .setDescription('Set the staff role authorized to manage, view, and close support tickets')
            .addRoleOption(opt =>
              opt.setName('role').setDescription('Staff role for ticket managers').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('mod-log-channel')
            .setDescription('Set the channel where moderation actions (kicks, bans, timeouts, warns) are logged')
            .addChannelOption(opt =>
              opt
                .setName('channel')
                .setDescription('Target logging text channel')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('welcome-channel')
            .setDescription('Set the channel where new member welcome embeds are dispatched')
            .addChannelOption(opt =>
              opt
                .setName('channel')
                .setDescription('Target welcome channel')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('prefix')
            .setDescription('Set custom command prefix for text commands')
            .addStringOption(opt =>
              opt.setName('prefix').setDescription('Prefix string (e.g. !, ?, /)').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('view').setDescription('View current server configuration')
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName('user')
        .setDescription('Configure personal developer settings and AI preferences')
        .addSubcommand(sub =>
          sub
            .setName('ai-provider')
            .setDescription('Select your preferred AI provider for /helix-ai and /helix-explain')
            .addStringOption(opt =>
              opt
                .setName('provider')
                .setDescription('AI Provider')
                .setRequired(true)
                .addChoices(
                  { name: 'Google Antigravity / Gemini', value: 'antigravity' },
                  { name: 'GitHub Copilot', value: 'copilot' },
                  { name: 'Open Code', value: 'opencode' }
                )
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('notifications')
            .setDescription('Enable or disable direct message notifications from HELIX')
            .addBooleanOption(opt =>
              opt.setName('enabled').setDescription('Receive DM notifications').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('view').setDescription('View your personal user settings')
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const db = BotDatabase.getInstance();
    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (group === 'guild') {
      if (!interaction.guild) {
        await interaction.editReply({ content: '❌ Guild settings can only be managed within a server.' });
        return;
      }

      const member = interaction.member as GuildMember;
      if (subcommand !== 'view' && !member.permissions.has(PermissionFlagsBits.ManageGuild) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.editReply({ content: '❌ You need Manage Server or Administrator permission to modify guild settings.' });
        return;
      }

      if (subcommand === 'tickets-hub') {
        const channel = interaction.options.getChannel('channel', true);
        db.setGuildSettings({
          guildId: interaction.guild.id,
          ticketsHubChannelId: channel.id,
        });

        const embed = new EmbedBuilder()
          .setTitle('⚙️ Guild Settings Updated: Tickets Hub')
          .setDescription(`Tickets Hub channel set to <#${channel.id}>.`)
          .setColor(0x00ff88)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'ticket-manager-role') {
        const role = interaction.options.getRole('role', true);
        db.setGuildSettings({
          guildId: interaction.guild.id,
          ticketManagerRoleId: role.id,
        });

        const embed = new EmbedBuilder()
          .setTitle('⚙️ Guild Settings Updated: Ticket Manager Role')
          .setDescription(`Ticket Manager role set to <@&${role.id}>.`)
          .setColor(0x00ff88)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'mod-log-channel') {
        const channel = interaction.options.getChannel('channel', true);
        db.setGuildSettings({
          guildId: interaction.guild.id,
          modLogChannelId: channel.id,
        });

        const embed = new EmbedBuilder()
          .setTitle('⚙️ Guild Settings Updated: Moderation Log Channel')
          .setDescription(`Moderation actions will now be logged to <#${channel.id}>.`)
          .setColor(0x00ff88)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'welcome-channel') {
        const channel = interaction.options.getChannel('channel', true);
        db.setGuildSettings({
          guildId: interaction.guild.id,
          welcomeChannelId: channel.id,
        });

        const embed = new EmbedBuilder()
          .setTitle('⚙️ Guild Settings Updated: Welcome Channel')
          .setDescription(`New member welcome notices will be sent to <#${channel.id}>.`)
          .setColor(0x00ff88)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'prefix') {
        const prefix = interaction.options.getString('prefix', true);
        db.setGuildSettings({
          guildId: interaction.guild.id,
          prefix,
        });

        const embed = new EmbedBuilder()
          .setTitle('⚙️ Guild Settings Updated: Prefix')
          .setDescription(`Server prefix updated to \`${prefix}\``)
          .setColor(0x00ff88)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'view') {
        const settings = db.getGuildSettings(interaction.guild.id);
        const ticketStats = db.getTicketStats(interaction.guild.id);

        const embed = new EmbedBuilder()
          .setTitle(`⚙️ Server Configuration • ${interaction.guild.name}`)
          .setColor(0x00d2ff)
          .addFields(
            {
              name: 'Tickets Hub Channel',
              value: settings?.ticketsHubChannelId ? `<#${settings.ticketsHubChannelId}>` : '`Not Set (use /helix-set guild tickets-hub)`',
              inline: true,
            },
            {
              name: 'Ticket Manager Role',
              value: settings?.ticketManagerRoleId ? `<@&${settings.ticketManagerRoleId}>` : '`Not Set (use /helix-set guild ticket-manager-role)`',
              inline: true,
            },
            {
              name: 'Moderation Log Channel',
              value: settings?.modLogChannelId ? `<#${settings.modLogChannelId}>` : '`Not Set (use /helix-set guild mod-log-channel)`',
              inline: true,
            },
            {
              name: 'Welcome Channel',
              value: settings?.welcomeChannelId ? `<#${settings.welcomeChannelId}>` : '`Not Set`',
              inline: true,
            },
            {
              name: 'Command Prefix',
              value: `\`${settings?.prefix || '/'}\``,
              inline: true,
            },
            {
              name: 'Ticket Statistics',
              value: `Total: ${ticketStats.total} | Open: ${ticketStats.open} | Closed: ${ticketStats.closed}`,
              inline: true,
            }
          )
          .setFooter({ text: 'HELIX Unified Configuration Engine' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }

    if (group === 'user') {
      if (subcommand === 'ai-provider') {
        const provider = interaction.options.getString('provider', true);
        db.setUserSettings({
          userId: interaction.user.id,
          defaultAiProvider: provider,
        });

        const embed = new EmbedBuilder()
          .setTitle('⚙️ User Preference Updated: Default AI Provider')
          .setDescription(`Default AI provider set to **${provider}**.`)
          .setColor(0x00ff88)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'notifications') {
        const enabled = interaction.options.getBoolean('enabled', true);
        db.setUserSettings({
          userId: interaction.user.id,
          notificationsEnabled: enabled,
        });

        const embed = new EmbedBuilder()
          .setTitle('⚙️ User Preference Updated: Notifications')
          .setDescription(`DM notifications are now **${enabled ? 'Enabled' : 'Disabled'}**.`)
          .setColor(0x00ff88)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'view') {
        const userSettings = db.getUserSettings(interaction.user.id);
        const sessions = db.getUserSessions(interaction.user.id);

        const embed = new EmbedBuilder()
          .setTitle(`⚙️ Personal Settings • ${interaction.user.username}`)
          .setColor(0x38bdf8)
          .addFields(
            {
              name: 'Preferred AI Provider',
              value: `\`${userSettings?.defaultAiProvider || 'None (System Default)'}\``,
              inline: true,
            },
            {
              name: 'DM Notifications',
              value: userSettings?.notificationsEnabled !== false ? '`Enabled`' : '`Disabled`',
              inline: true,
            },
            {
              name: 'Active Authenticated Sessions',
              value: sessions.length > 0 ? sessions.map(s => `• **${s.provider}** (logged in)`).join('\n') : '`No personal sessions (use /helix-auth action:login)`',
              inline: false,
            }
          )
          .setFooter({ text: 'HELIX User Preferences' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }
  },
};
