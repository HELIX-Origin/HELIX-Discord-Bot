import { PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { getBotToken, getClientId } from '../../env.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import { registerGuildSlashCategories, clearGuildSlashCommands, getSlashCommandCategories } from '../../handlers/slash-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const set: CommandDefinition = {
  name: 'set',
  description: 'Configure guild and user settings',
  category: 'config',
  usage: '<setting> <value>',
  examples: ['set prefix >', 'set tickets-hub #support-tickets', 'set mod-log-channel #mod-logs', 'set slash enable moderation'],
  permissions: [PermissionFlagsBits.ManageGuild],
  subcommands: [
    {
      name: 'prefix',
      description: 'Set the server command prefix',
      options: [
        { name: 'prefix', description: 'New prefix character(s)', type: 'string', required: true },
      ],
    },
    {
      name: 'tickets-hub',
      description: 'Set the ticket hub channel',
      options: [
        { name: 'channel', description: 'Target text channel', type: 'channel', required: true },
      ],
    },
    {
      name: 'ticket-manager-role',
      description: 'Set the ticket manager role',
      options: [
        { name: 'role', description: 'Staff role', type: 'role', required: true },
      ],
    },
    {
      name: 'mod-log-channel',
      description: 'Set the moderation log channel',
      options: [
        { name: 'channel', description: 'Target channel', type: 'channel', required: true },
      ],
    },
    {
      name: 'welcome-channel',
      description: 'Set the welcome channel',
      options: [
        { name: 'channel', description: 'Target channel', type: 'channel', required: true },
      ],
    },
    {
      name: 'slash',
      description: 'Manage optional slash command categories',
      options: [
        {
          name: 'action',
          description: 'Action: enable, disable, view, clear',
          type: 'string',
          required: true,
          choices: [
            { name: 'enable', value: 'enable' },
            { name: 'disable', value: 'disable' },
            { name: 'view', value: 'view' },
            { name: 'clear', value: 'clear' },
          ],
        },
        {
          name: 'category',
          description: 'Category: info, project, config, mod, util, all',
          type: 'string',
          required: false,
          choices: [
            { name: 'all', value: 'all' },
            { name: 'info', value: 'info' },
            { name: 'project', value: 'project' },
            { name: 'config', value: 'config' },
            { name: 'mod', value: 'mod' },
            { name: 'util', value: 'util' },
          ],
        },
      ],
    },
    { name: 'view', description: 'View current server configuration' },
  ],
  async execute({ message, interaction, guild, user, args = [] }) {
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
      if (sub === 'slash') {
        const action = interaction.options.getString('action', true).toLowerCase();
        const category = interaction.options.getString('category')?.toLowerCase();
        const current = db.getGuildSettings(guild.id);
        let categories = new Set<string>(current?.enabledSlashCategories || []);

        const token = getBotToken();
        const clientId = getClientId() || interaction.client?.user?.id || '';

        if (action === 'view') {
          const list = categories.size > 0 ? Array.from(categories).map(c => `\`${c}\``).join(', ') : '`None (Prefix Only)`';
          return interaction.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: `Currently enabled slash command categories for this guild:\n\n${list}`,
            })],
          });
        }

        if (action === 'clear') {
          db.setGuildSettings({ guildId: guild.id, enabledSlashCategories: [] });
          if (token && clientId) {
            await clearGuildSlashCommands(token, clientId, guild.id).catch(() => {});
          }
          return interaction.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: '🧹 Disabled and cleared all slash commands for this guild.',
            })],
          });
        }

        if (action === 'enable') {
          if (!category) {
            return interaction.reply({ embeds: [formatError('missing_argument', { arg: 'category' })], ephemeral: true });
          }
          if (category === 'all') {
            const allCats = getSlashCommandCategories();
            categories = new Set(allCats);
          } else {
            categories.add(category);
          }
          const catArr = Array.from(categories);
          db.setGuildSettings({ guildId: guild.id, enabledSlashCategories: catArr });
          let registeredCount = 0;
          if (token && clientId) {
            const res = await registerGuildSlashCategories(token, clientId, guild.id, catArr).catch(() => null);
            if (res) registeredCount = res.count;
          }
          return interaction.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: `✅ Enabled slash command categories: ${catArr.map(c => `\`${c}\``).join(', ')}\n${registeredCount > 0 ? `Registered **${registeredCount}** slash commands.` : ''}`,
            })],
          });
        }

        if (action === 'disable') {
          if (!category) {
            return interaction.reply({ embeds: [formatError('missing_argument', { arg: 'category' })], ephemeral: true });
          }
          if (category === 'all') {
            categories.clear();
          } else {
            categories.delete(category);
          }
          const catArr = Array.from(categories);
          db.setGuildSettings({ guildId: guild.id, enabledSlashCategories: catArr });
          if (token && clientId) {
            if (catArr.length > 0) {
              await registerGuildSlashCategories(token, clientId, guild.id, catArr).catch(() => {});
            } else {
              await clearGuildSlashCommands(token, clientId, guild.id).catch(() => {});
            }
          }
          return interaction.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: `ℹ️ Disabled category \`${category}\`. Active categories: ${catArr.length > 0 ? catArr.map(c => `\`${c}\``).join(', ') : '`None (Prefix Only)`'}`,
            })],
          });
        }
      }
      if (sub === 'view') {
        const s = db.getGuildSettings(guild.id);
        const slashText = s?.enabledSlashCategories?.length
          ? s.enabledSlashCategories.map(c => `\`${c}\``).join(', ')
          : '`None (Prefix Only)`';
        const embed = createEmbed('config.set.embed_view', {
          prefix: s?.prefix || '>',
          ticketsHub: s?.ticketsHubChannelId ? `<#${s.ticketsHubChannelId}>` : '`Not Set`',
          managerRole: s?.ticketManagerRoleId ? `<@&${s.ticketManagerRoleId}>` : '`Not Set`',
          modLog: s?.modLogChannelId ? `<#${s.modLogChannelId}>` : '`Not Set`',
          welcome: s?.welcomeChannelId ? `<#${s.welcomeChannelId}>` : '`Not Set`',
          slashCategories: slashText,
        });
        return interaction.reply({ embeds: [embed] });
      }
      return;
    }

    // Prefix: >set <subcommand> ...
    const sub = (args[0] || 'view').toLowerCase();

    if (sub === 'prefix') {
      const prefix = args[1];
      if (!prefix) return message!.reply({ embeds: [formatError('missing_argument', { arg: 'prefix' })] });
      db.setGuildSettings({ guildId: guild.id, prefix });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Command Prefix', value: `\`${prefix}\`` })] });
    }

    if (sub === 'tickets-hub') {
      const chMatch = args[1]?.match(/^<#(\d+)>$/) || args[1];
      const chId = Array.isArray(chMatch) ? chMatch[1] : chMatch;
      if (!chId) return message!.reply({ embeds: [formatError('missing_argument', { arg: 'channel' })] });
      db.setGuildSettings({ guildId: guild.id, ticketsHubChannelId: chId });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Tickets Hub Channel', value: `<#${chId}>` })] });
    }

    if (sub === 'ticket-manager-role') {
      const roleMatch = args[1]?.match(/^<@&(\d+)>$/) || args[1];
      const roleId = Array.isArray(roleMatch) ? roleMatch[1] : roleMatch;
      if (!roleId) return message!.reply({ embeds: [formatError('missing_argument', { arg: 'role' })] });
      db.setGuildSettings({ guildId: guild.id, ticketManagerRoleId: roleId });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Ticket Manager Role', value: `<@&${roleId}>` })] });
    }

    if (sub === 'mod-log-channel') {
      const chMatch = args[1]?.match(/^<#(\d+)>$/) || args[1];
      const chId = Array.isArray(chMatch) ? chMatch[1] : chMatch;
      if (!chId) return message!.reply({ embeds: [formatError('missing_argument', { arg: 'channel' })] });
      db.setGuildSettings({ guildId: guild.id, modLogChannelId: chId });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Moderation Log Channel', value: `<#${chId}>` })] });
    }

    if (sub === 'welcome-channel') {
      const chMatch = args[1]?.match(/^<#(\d+)>$/) || args[1];
      const chId = Array.isArray(chMatch) ? chMatch[1] : chMatch;
      if (!chId) return message!.reply({ embeds: [formatError('missing_argument', { arg: 'channel' })] });
      db.setGuildSettings({ guildId: guild.id, welcomeChannelId: chId });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Welcome Channel', value: `<#${chId}>` })] });
    }

    if (sub === 'slash') {
      const action = args[1]?.toLowerCase();
      const category = args[2]?.toLowerCase();
      const current = db.getGuildSettings(guild.id);
      let categories = new Set<string>(current?.enabledSlashCategories || []);

      const token = getBotToken();
      const clientId = getClientId() || message?.client?.user?.id || '';

      if (action === 'view') {
        const list = categories.size > 0 ? Array.from(categories).map(c => `\`${c}\``).join(', ') : '`None (Prefix Only)`';
        return message!.reply({
          embeds: [createEmbed('config.set.embed_slash_updated', {
            description: `Currently enabled slash command categories for this guild:\n\n${list}`,
          })],
        });
      }

      if (action === 'clear') {
        db.setGuildSettings({ guildId: guild.id, enabledSlashCategories: [] });
        if (token && clientId) {
          await clearGuildSlashCommands(token, clientId, guild.id).catch(() => {});
        }
        return message!.reply({
          embeds: [createEmbed('config.set.embed_slash_updated', {
            description: '🧹 Disabled and cleared all slash commands for this guild.',
          })],
        });
      }

      if (action === 'enable') {
        if (!category) {
          return message!.reply({ embeds: [formatError('missing_argument', { arg: 'category' })] });
        }
        if (category === 'all') {
          const allCats = getSlashCommandCategories();
          categories = new Set(allCats);
        } else {
          categories.add(category);
        }
        const catArr = Array.from(categories);
        db.setGuildSettings({ guildId: guild.id, enabledSlashCategories: catArr });
        let registeredCount = 0;
        if (token && clientId) {
          const res = await registerGuildSlashCategories(token, clientId, guild.id, catArr).catch(() => null);
          if (res) registeredCount = res.count;
        }
        return message!.reply({
          embeds: [createEmbed('config.set.embed_slash_updated', {
            description: `✅ Enabled slash command categories: ${catArr.map(c => `\`${c}\``).join(', ')}\n${registeredCount > 0 ? `Registered **${registeredCount}** slash commands.` : ''}`,
          })],
        });
      }

      if (action === 'disable') {
        if (!category) {
          return message!.reply({ embeds: [formatError('missing_argument', { arg: 'category' })] });
        }
        if (category === 'all') {
          categories.clear();
        } else {
          categories.delete(category);
        }
        const catArr = Array.from(categories);
        db.setGuildSettings({ guildId: guild.id, enabledSlashCategories: catArr });
        if (token && clientId) {
          if (catArr.length > 0) {
            await registerGuildSlashCategories(token, clientId, guild.id, catArr).catch(() => {});
          } else {
            await clearGuildSlashCommands(token, clientId, guild.id).catch(() => {});
          }
        }
        return message!.reply({
          embeds: [createEmbed('config.set.embed_slash_updated', {
            description: `ℹ️ Disabled category \`${category}\`. Active categories: ${catArr.length > 0 ? catArr.map(c => `\`${c}\``).join(', ') : '`None (Prefix Only)`'}`,
          })],
        });
      }

      return message!.reply({ embeds: [formatError('invalid_argument', { arg: 'action', value: action || 'empty' })] });
    }

    if (sub === 'view') {
      const s = db.getGuildSettings(guild.id);
      const slashText = s?.enabledSlashCategories?.length
        ? s.enabledSlashCategories.map(c => `\`${c}\``).join(', ')
        : '`None (Prefix Only)`';
      const embed = createEmbed('config.set.embed_view', {
        prefix: s?.prefix || '>',
        ticketsHub: s?.ticketsHubChannelId ? `<#${s.ticketsHubChannelId}>` : '`Not Set`',
        managerRole: s?.ticketManagerRoleId ? `<@&${s.ticketManagerRoleId}>` : '`Not Set`',
        modLog: s?.modLogChannelId ? `<#${s.modLogChannelId}>` : '`Not Set`',
        welcome: s?.welcomeChannelId ? `<#${s.welcomeChannelId}>` : '`Not Set`',
        slashCategories: slashText,
      });
      return message!.reply({ embeds: [embed] });
    }

    return message!.reply({ embeds: [formatError('subcommand_not_found')] });
  },
};
