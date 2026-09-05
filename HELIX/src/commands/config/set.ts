import { PermissionFlagsBits } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { getBotToken, getClientId } from '../../env.js';
import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import { getCommandHelpEmbed } from '../../handlers/help-registrar.js';
import {
  syncGuildSlashCategories,
  clearGuildSlashCommands,
  getSlashCommandCategories,
  normalizeCategory,
  normalizeCategories,
  CANONICAL_SLASH_CATEGORIES,
} from '../../handlers/slash-handler.js';
import { botSettings } from '../../handlers/settings-manager.js';
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
          description: 'Category: moderation, utility, plugins, info, project, config, all',
          type: 'string',
          required: false,
          choices: [
            { name: 'all', value: 'all' },
            { name: 'moderation', value: 'moderation' },
            { name: 'utility', value: 'utility' },
            { name: 'plugins', value: 'plugins' },
            { name: 'info', value: 'info' },
            { name: 'project', value: 'project' },
            { name: 'config', value: 'config' },
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
        botSettings.setGuildSettings({ guildId: guild.id, prefix });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Command Prefix', value: `\`${prefix}\`` })] });
      }
      if (sub === 'tickets-hub') {
        const ch = interaction.options.getChannel('channel', true);
        botSettings.setGuildSettings({ guildId: guild.id, ticketsHubChannelId: ch.id });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Tickets Hub Channel', value: `<#${ch.id}>` })] });
      }
      if (sub === 'ticket-manager-role') {
        const role = interaction.options.getRole('role', true);
        botSettings.setGuildSettings({ guildId: guild.id, ticketManagerRoleId: role.id });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Ticket Manager Role', value: `<@&${role.id}>` })] });
      }
      if (sub === 'mod-log-channel') {
        const ch = interaction.options.getChannel('channel', true);
        botSettings.setGuildSettings({ guildId: guild.id, modLogChannelId: ch.id });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Moderation Log Channel', value: `<#${ch.id}>` })] });
      }
      if (sub === 'welcome-channel') {
        const ch = interaction.options.getChannel('channel', true);
        botSettings.setGuildSettings({ guildId: guild.id, welcomeChannelId: ch.id });
        return interaction.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Welcome Channel', value: `<#${ch.id}>` })] });
      }
      if (sub === 'slash') {
        const action = interaction.options.getString('action', true).toLowerCase();
        const rawCategory = interaction.options.getString('category')?.toLowerCase();
        const current = botSettings.getGuildSettings(guild.id);
        let categories = new Set<string>(current?.enabledSlashCategories || []);

        if (action === 'view') {
          const list = categories.size > 0 ? Array.from(categories).map(c => `\`${c}\``).join(', ') : '`None (Prefix Only)`';
          return interaction.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: `Currently enabled slash command categories for this guild:\n\n${list}`,
            })],
          });
        }

        if (action === 'clear') {
          botSettings.setGuildSettings({ guildId: guild.id, enabledSlashCategories: [] });
          try {
            await syncGuildSlashCategories(guild.id, []);
          } catch (err: any) {}
          return interaction.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: '🧹 Disabled and cleared all slash commands for this guild.',
            })],
          });
        }

        if (action === 'enable') {
          if (!rawCategory) {
            const prefix = botSettings.getPrefix(guild.id);
            const helpEmbed = getCommandHelpEmbed('set', prefix, {
              missingNotice: `Please provide a category for subcommand \`slash enable\` (e.g. \`${prefix}set slash enable moderation\`).`,
              customUsage: `${prefix}set slash enable <category|all>`,
            });
            return interaction.reply({ embeds: [helpEmbed || formatError('missing_argument', { arg: 'category' })], ephemeral: true });
          }
          if (rawCategory === 'all') {
            categories = new Set(CANONICAL_SLASH_CATEGORIES);
          } else {
            const normalized = normalizeCategory(rawCategory);
            categories.add(normalized);
          }
          const catArr = Array.from(categories);
          botSettings.setGuildSettings({ guildId: guild.id, enabledSlashCategories: catArr });
          let registeredCount = 0;
          let syncError: string | null = null;
          try {
            const res = await syncGuildSlashCategories(guild.id, catArr);
            registeredCount = res.count;
          } catch (err: any) {
            syncError = err.message;
          }

          if (syncError) {
            return interaction.reply({
              embeds: [createEmbed('config.set.embed_slash_updated', {
                description: `⚠️ Enabled categories in settings (${catArr.map(c => `\`${c}\``).join(', ')}), but Discord registration returned: \`${syncError}\`\nEnsure the bot is invited with the \`applications.commands\` OAuth2 scope.`,
              })],
            });
          }

          return interaction.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: `✅ Enabled slash command categories: ${catArr.map(c => `\`${c}\``).join(', ')}\n${registeredCount > 0 ? `Registered **${registeredCount}** slash command(s) with Discord.` : 'No commands in selected categories.'}`,
            })],
          });
        }

        if (action === 'disable') {
          if (!rawCategory) {
            const prefix = botSettings.getPrefix(guild.id);
            const helpEmbed = getCommandHelpEmbed('set', prefix, {
              missingNotice: `Please provide a category for subcommand \`slash disable\` (e.g. \`${prefix}set slash disable moderation\`).`,
              customUsage: `${prefix}set slash disable <category|all>`,
            });
            return interaction.reply({ embeds: [helpEmbed || formatError('missing_argument', { arg: 'category' })], ephemeral: true });
          }
          if (rawCategory === 'all') {
            categories.clear();
          } else {
            const normalized = normalizeCategory(rawCategory);
            categories.delete(normalized);
          }
          const catArr = Array.from(categories);
          botSettings.setGuildSettings({ guildId: guild.id, enabledSlashCategories: catArr });
          let syncError: string | null = null;
          let registeredCount = 0;
          try {
            const res = await syncGuildSlashCategories(guild.id, catArr);
            registeredCount = res.count;
          } catch (err: any) {
            syncError = err.message;
          }

          if (syncError) {
            return interaction.reply({
              embeds: [createEmbed('config.set.embed_slash_updated', {
                description: `⚠️ Disabled category in settings, but Discord synchronization returned: \`${syncError}\``,
              })],
            });
          }

          return interaction.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: `ℹ️ Disabled category \`${rawCategory}\`. Active categories: ${catArr.length > 0 ? catArr.map(c => `\`${c}\``).join(', ') : '`None (Prefix Only)`'}${catArr.length > 0 ? `\nSynchronized **${registeredCount}** slash commands.` : '\nCleared guild slash commands.'}`,
            })],
          });
        }
      }
      if (sub === 'view') {
        const s = botSettings.getGuildSettings(guild.id);
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
    const prefix = botSettings.getPrefix(guild.id);

    if (sub === 'prefix') {
      const newPrefix = args[1];
      if (!newPrefix) {
        const helpEmbed = getCommandHelpEmbed('set', prefix, {
          missingNotice: 'Please provide a `<prefix>` character to set.',
          customUsage: `${prefix}set prefix <prefix>`,
        });
        return message!.reply({ embeds: [helpEmbed!] });
      }
      botSettings.setGuildSettings({ guildId: guild.id, prefix: newPrefix });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Command Prefix', value: `\`${newPrefix}\`` })] });
    }

    if (sub === 'tickets-hub') {
      const chMatch = args[1]?.match(/^<#(\d+)>$/) || args[1];
      const chId = Array.isArray(chMatch) ? chMatch[1] : chMatch;
      if (!chId) {
        const helpEmbed = getCommandHelpEmbed('set', prefix, {
          missingNotice: 'Please provide a `#channel` for the tickets hub.',
          customUsage: `${prefix}set tickets-hub <channel>`,
        });
        return message!.reply({ embeds: [helpEmbed!] });
      }
      botSettings.setGuildSettings({ guildId: guild.id, ticketsHubChannelId: chId });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Tickets Hub Channel', value: `<#${chId}>` })] });
    }

    if (sub === 'ticket-manager-role') {
      const roleMatch = args[1]?.match(/^<@&(\d+)>$/) || args[1];
      const roleId = Array.isArray(roleMatch) ? roleMatch[1] : roleMatch;
      if (!roleId) {
        const helpEmbed = getCommandHelpEmbed('set', prefix, {
          missingNotice: 'Please provide a `@role` for the ticket manager role.',
          customUsage: `${prefix}set ticket-manager-role <role>`,
        });
        return message!.reply({ embeds: [helpEmbed!] });
      }
      botSettings.setGuildSettings({ guildId: guild.id, ticketManagerRoleId: roleId });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Ticket Manager Role', value: `<@&${roleId}>` })] });
    }

    if (sub === 'mod-log-channel') {
      const chMatch = args[1]?.match(/^<#(\d+)>$/) || args[1];
      const chId = Array.isArray(chMatch) ? chMatch[1] : chMatch;
      if (!chId) {
        const helpEmbed = getCommandHelpEmbed('set', prefix, {
          missingNotice: 'Please provide a `#channel` for moderation log output.',
          customUsage: `${prefix}set mod-log-channel <channel>`,
        });
        return message!.reply({ embeds: [helpEmbed!] });
      }
      botSettings.setGuildSettings({ guildId: guild.id, modLogChannelId: chId });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Moderation Log Channel', value: `<#${chId}>` })] });
    }

    if (sub === 'welcome-channel') {
      const chMatch = args[1]?.match(/^<#(\d+)>$/) || args[1];
      const chId = Array.isArray(chMatch) ? chMatch[1] : chMatch;
      if (!chId) {
        const helpEmbed = getCommandHelpEmbed('set', prefix, {
          missingNotice: 'Please provide a `#channel` for welcome message dispatch.',
          customUsage: `${prefix}set welcome-channel <channel>`,
        });
        return message!.reply({ embeds: [helpEmbed!] });
      }
      botSettings.setGuildSettings({ guildId: guild.id, welcomeChannelId: chId });
      return message!.reply({ embeds: [createEmbed('config.set.embed_success', { setting: 'Welcome Channel', value: `<#${chId}>` })] });
    }

    if (sub === 'slash') {
      const action = args[1]?.toLowerCase();
      const rawCategory = args[2]?.toLowerCase();
      const current = botSettings.getGuildSettings(guild.id);
      let categories = new Set<string>(current?.enabledSlashCategories || []);

      if (action === 'view') {
        const list = categories.size > 0 ? Array.from(categories).map(c => `\`${c}\``).join(', ') : '`None (Prefix Only)`';
        return message!.reply({
          embeds: [createEmbed('config.set.embed_slash_updated', {
            description: `Currently enabled slash command categories for this guild:\n\n${list}`,
          })],
        });
      }

      if (action === 'clear') {
        botSettings.setGuildSettings({ guildId: guild.id, enabledSlashCategories: [] });
        try {
          await syncGuildSlashCategories(guild.id, []);
        } catch (err: any) {}
        return message!.reply({
          embeds: [createEmbed('config.set.embed_slash_updated', {
            description: '🧹 Disabled and cleared all slash commands for this guild.',
          })],
        });
      }

      if (action === 'enable') {
        if (!rawCategory) {
          const helpEmbed = getCommandHelpEmbed('set', prefix, {
            missingNotice: 'Please provide a `<category>` (e.g. `moderation`, `utility`, `plugins`, `info`, `project`, `config`, `all`) to enable.',
            customUsage: `${prefix}set slash enable <category>`,
          });
          return message!.reply({ embeds: [helpEmbed!] });
        }
        if (rawCategory === 'all') {
          categories = new Set(CANONICAL_SLASH_CATEGORIES);
        } else {
          const normalized = normalizeCategory(rawCategory);
          categories.add(normalized);
        }
        const catArr = Array.from(categories);
        botSettings.setGuildSettings({ guildId: guild.id, enabledSlashCategories: catArr });
        let registeredCount = 0;
        let syncError: string | null = null;
        try {
          const res = await syncGuildSlashCategories(guild.id, catArr);
          registeredCount = res.count;
        } catch (err: any) {
          syncError = err.message;
        }

        if (syncError) {
          return message!.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: `⚠️ Enabled categories in settings (${catArr.map(c => `\`${c}\``).join(', ')}), but Discord registration returned: \`${syncError}\`\nEnsure the bot is invited with the \`applications.commands\` OAuth2 scope.`,
            })],
          });
        }

        return message!.reply({
          embeds: [createEmbed('config.set.embed_slash_updated', {
            description: `✅ Enabled slash command categories: ${catArr.map(c => `\`${c}\``).join(', ')}\n${registeredCount > 0 ? `Registered **${registeredCount}** slash command(s) with Discord.` : 'No commands in selected categories.'}`,
          })],
        });
      }

      if (action === 'disable') {
        if (!rawCategory) {
          const helpEmbed = getCommandHelpEmbed('set', prefix, {
            missingNotice: 'Please provide a `<category>` to disable.',
            customUsage: `${prefix}set slash disable <category>`,
          });
          return message!.reply({ embeds: [helpEmbed!] });
        }
        if (rawCategory === 'all') {
          categories.clear();
        } else {
          const normalized = normalizeCategory(rawCategory);
          categories.delete(normalized);
        }
        const catArr = Array.from(categories);
        botSettings.setGuildSettings({ guildId: guild.id, enabledSlashCategories: catArr });
        let syncError: string | null = null;
        let registeredCount = 0;
        try {
          const res = await syncGuildSlashCategories(guild.id, catArr);
          registeredCount = res.count;
        } catch (err: any) {
          syncError = err.message;
        }

        if (syncError) {
          return message!.reply({
            embeds: [createEmbed('config.set.embed_slash_updated', {
              description: `⚠️ Disabled category in settings, but Discord synchronization returned: \`${syncError}\``,
            })],
          });
        }

        return message!.reply({
          embeds: [createEmbed('config.set.embed_slash_updated', {
            description: `ℹ️ Disabled category \`${rawCategory}\`. Active categories: ${catArr.length > 0 ? catArr.map(c => `\`${c}\``).join(', ') : '`None (Prefix Only)`'}${catArr.length > 0 ? `\nSynchronized **${registeredCount}** slash commands.` : '\nCleared guild slash commands.'}`,
          })],
        });
      }

      const helpEmbed = getCommandHelpEmbed('set', prefix, {
        missingNotice: `Unknown slash action "${action || ''}". Available: \`enable\`, \`disable\`, \`view\`, \`clear\``,
        customUsage: `${prefix}set slash <enable|disable|view|clear> [category]`,
      });
      return message!.reply({ embeds: [helpEmbed!] });
    }

    if (sub === 'view') {
      const s = botSettings.getGuildSettings(guild.id);
      const slashText = s?.enabledSlashCategories?.length
        ? s.enabledSlashCategories.map(c => `\`${c}\``).join(', ')
        : '`None (Prefix Only)`';
      const embed = createEmbed('config.set.embed_view', {
        prefix: s?.prefix || '>',
        ticketsHub: s?.ticketsHubChannelId ? `<#${s.ticketsHubChannelId}>` : '`Not Set`',
        managerRole: s?.ticketManagerRoleId ? `<@&${s.ticketManagerRoleId}>` : '`Not Set`',
        modLogChannel: s?.modLogChannelId ? `<#${s.modLogChannelId}>` : '`Not Set`',
        welcomeChannel: s?.welcomeChannelId ? `<#${s.welcomeChannelId}>` : '`Not Set`',
        slashCategories: slashText,
      });
      return message!.reply({ embeds: [embed] });
    }

    const helpEmbed = getCommandHelpEmbed('set', prefix, {
      missingNotice: `Unknown setting or subcommand "${sub}". Available: \`prefix\`, \`tickets-hub\`, \`ticket-manager-role\`, \`mod-log-channel\`, \`welcome-channel\`, \`slash\`, \`view\``,
    });
    return message!.reply({ embeds: [helpEmbed!] });
  },
};
