import { PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const set: CommandDefinition = {
  name: 'set', description: 'Configure guild and user settings', category: 'config',
  permissions: ['32' as any],
  subcommands: [
    { name: 'prefix', description: 'Set the server command prefix', options: [
      { name: 'prefix', description: 'New prefix character(s)', type: 'string', required: true },
    ]},
    { name: 'tickets-hub', description: 'Set the ticket hub channel', options: [
      { name: 'channel', description: 'Target text channel', type: 'channel', required: true },
    ]},
    { name: 'ticket-manager-role', description: 'Set the ticket manager role', options: [
      { name: 'role', description: 'Staff role', type: 'role', required: true },
    ]},
    { name: 'mod-log-channel', description: 'Set the moderation log channel', options: [
      { name: 'channel', description: 'Target channel', type: 'channel', required: true },
    ]},
    { name: 'welcome-channel', description: 'Set the welcome channel', options: [
      { name: 'channel', description: 'Target channel', type: 'channel', required: true },
    ]},
    { name: 'view', description: 'View current server configuration' },
  ],
  async execute({ message, interaction, guild, user }) {
    const db = BotDatabase.getInstance();

    if (interaction) {
      const sub = interaction.options.getSubcommand();
      const member = interaction.member as any;
      if (sub !== 'view' && !member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ embeds: [formatError('permission_denied')], ephemeral: true });
      }

      if (sub === 'prefix') {
        const prefix = interaction.options.getString('prefix', true);
        db.setGuildSettings({ guildId: guild.id, prefix });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Command Prefix', value: `\`${prefix}\`` })] });
      }
      if (sub === 'tickets-hub') {
        const ch = interaction.options.getChannel('channel', true);
        db.setGuildSettings({ guildId: guild.id, ticketsHubChannelId: ch.id });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Tickets Hub Channel', value: `<#${ch.id}>` })] });
      }
      if (sub === 'ticket-manager-role') {
        const role = interaction.options.getRole('role', true);
        db.setGuildSettings({ guildId: guild.id, ticketManagerRoleId: role.id });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Ticket Manager Role', value: `<@&${role.id}>` })] });
      }
      if (sub === 'mod-log-channel') {
        const ch = interaction.options.getChannel('channel', true);
        db.setGuildSettings({ guildId: guild.id, modLogChannelId: ch.id });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Moderation Log Channel', value: `<#${ch.id}>` })] });
      }
      if (sub === 'welcome-channel') {
        const ch = interaction.options.getChannel('channel', true);
        db.setGuildSettings({ guildId: guild.id, welcomeChannelId: ch.id });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Welcome Channel', value: `<#${ch.id}>` })] });
      }
      if (sub === 'view') {
        const s = db.getGuildSettings(guild.id);
        const embed = createEmbed('config.set.embed_view', {
          prefix: s?.prefix || '>',
          ticketsHub: s?.ticketsHubChannelId ? `<#${s.ticketsHubChannelId}>` : '`Not Set`',
          managerRole: s?.ticketManagerRoleId ? `<@&${s.ticketManagerRoleId}>` : '`Not Set`',
          modLog: s?.modLogChannelId ? `<#${s.modLogChannelId}>` : '`Not Set`',
          welcome: s?.welcomeChannelId ? `<#${s.welcomeChannelId}>` : '`Not Set`',
        });
        return interaction.reply({ embeds: [embed] });
      }
      return;
    }

    // Prefix: >set prefix {input} | >set view
    const args = message!.content.split(/\s+/);
    const sub = args[1]?.toLowerCase();
    if (sub === 'prefix') {
      const prefix = args[2];
      if (!prefix) return message!.reply({ embeds: [formatError('missing_argument', { arg: 'prefix' })] });
      db.setGuildSettings({ guildId: guild.id, prefix });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Command Prefix', value: `\`${prefix}\`` })] });
    }
    if (sub === 'view') {
      const s = db.getGuildSettings(guild.id);
      const embed = createEmbed('config.set.embed_view', {
        prefix: s?.prefix || '>',
        ticketsHub: s?.ticketsHubChannelId ? `<#${s.ticketsHubChannelId}>` : '`Not Set`',
        managerRole: s?.ticketManagerRoleId ? `<@&${s.ticketManagerRoleId}>` : '`Not Set`',
        modLog: s?.modLogChannelId ? `<#${s.modLogChannelId}>` : '`Not Set`',
        welcome: s?.welcomeChannelId ? `<#${s.welcomeChannelId}>` : '`Not Set`',
      });
      return message!.reply({ embeds: [embed] });
    }
    return message!.reply({ embeds: [formatError('subcommand_not_found')] });
  },
};
