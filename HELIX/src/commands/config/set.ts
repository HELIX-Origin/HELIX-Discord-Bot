import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
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
        return interaction.reply({ content: '❌ Manage Server required.', ephemeral: true });
      }

      if (sub === 'prefix') {
        const prefix = interaction.options.getString('prefix', true);
        db.setGuildSettings({ guildId: guild.id, prefix });
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('⚙️ Prefix Updated').setColor(0x00ff88).setDescription(`Set to \`${prefix}\``).setTimestamp()] });
      }
      if (sub === 'tickets-hub') {
        const ch = interaction.options.getChannel('channel', true);
        db.setGuildSettings({ guildId: guild.id, ticketsHubChannelId: ch.id });
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('⚙️ Tickets Hub').setColor(0x00ff88).setDescription(`Set to <#${ch.id}>`).setTimestamp()] });
      }
      if (sub === 'ticket-manager-role') {
        const role = interaction.options.getRole('role', true);
        db.setGuildSettings({ guildId: guild.id, ticketManagerRoleId: role.id });
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('⚙️ Ticket Manager Role').setColor(0x00ff88).setDescription(`Set to <@&${role.id}>`).setTimestamp()] });
      }
      if (sub === 'mod-log-channel') {
        const ch = interaction.options.getChannel('channel', true);
        db.setGuildSettings({ guildId: guild.id, modLogChannelId: ch.id });
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('⚙️ Mod Log Channel').setColor(0x00ff88).setDescription(`Set to <#${ch.id}>`).setTimestamp()] });
      }
      if (sub === 'welcome-channel') {
        const ch = interaction.options.getChannel('channel', true);
        db.setGuildSettings({ guildId: guild.id, welcomeChannelId: ch.id });
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('⚙️ Welcome Channel').setColor(0x00ff88).setDescription(`Set to <#${ch.id}>`).setTimestamp()] });
      }
      if (sub === 'view') {
        const s = db.getGuildSettings(guild.id);
        const ts = db.getTicketStats(guild.id);
        const embed = new EmbedBuilder().setTitle(`⚙️ ${guild.name}`).setColor(0x00d2ff).addFields(
          { name: 'Prefix', value: `\`${s?.prefix || '>'}\``, inline: true },
          { name: 'Tickets Hub', value: s?.ticketsHubChannelId ? `<#${s.ticketsHubChannelId}>` : '`Not Set`', inline: true },
          { name: 'Mod Log', value: s?.modLogChannelId ? `<#${s.modLogChannelId}>` : '`Not Set`', inline: true },
          { name: 'Tickets', value: `Total: ${ts.total} | Open: ${ts.open}`, inline: true },
        ).setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }
      return;
    }

    // Prefix: >set prefix {input} | >set view
    const args = message!.content.split(/\s+/);
    const sub = args[1]?.toLowerCase();
    if (sub === 'prefix') {
      const prefix = args[2];
      if (!prefix) return message!.reply('❌ Usage: `>set prefix {input}`');
      db.setGuildSettings({ guildId: guild.id, prefix });
      return message!.reply({ embeds: [new EmbedBuilder().setTitle('⚙️ Prefix Updated').setColor(0x00ff88).setDescription(`Set to \`${prefix}\``).setTimestamp()] });
    }
    if (sub === 'view') {
      const s = db.getGuildSettings(guild.id);
      return message!.reply(`⚙️ Prefix: \`${s?.prefix || '>'}\``);
    }
    return message!.reply('❌ Usage: `>set <prefix|view> [value]`');
  },
};
