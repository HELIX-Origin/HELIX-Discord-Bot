import { Message } from 'discord.js';
import type { CommandDefinition, ExecuteContext } from '../../types/command.js';
import { getMessage, createEmbed, formatError } from '../../handlers/message-handler.js';
import {
  getAllPlugins,
  getEnabledPluginIds,
  getPlugin,
  enablePlugin,
  disablePlugin,
  unregisterPlugin,
  getRegistryStats,
} from '../../plugins/registry.js';
import { fetchAndStorePluginRepo, loadAllPlugins } from '../../plugins/plugin-loader.js';
import { BotDatabase } from '../../db/database.js';

function isMessageResponse(res: Message | any): res is Message {
  return res && typeof res.edit === 'function' && 'channelId' in res;
}

export const plugin: CommandDefinition = {
  name: 'plugin',
  description: 'Manage language plugins and database-backed repositories',
  category: 'plugins',
  subcommands: [
    { name: 'list', description: 'List installed plugins for this server' },
    {
      name: 'install',
      description: 'Install and store a plugin repository from GitHub into the database',
      options: [
        { name: 'repository', description: 'GitHub repository (owner/repo)', type: 'string', required: true },
      ],
    },
    {
      name: 'remove',
      description: 'Remove an installed plugin or repository',
      options: [
        { name: 'identifier', description: 'Plugin ID or repository (owner/repo) to remove', type: 'string', required: true },
      ],
    },
    {
      name: 'info',
      description: 'Show plugin details',
      options: [
        { name: 'plugin_id', description: 'Plugin ID', type: 'string', required: true },
      ],
    },
    {
      name: 'enable',
      description: 'Enable a plugin',
      options: [
        { name: 'plugin_id', description: 'Plugin ID to enable', type: 'string', required: true },
      ],
    },
    {
      name: 'disable',
      description: 'Disable a plugin',
      options: [
        { name: 'plugin_id', description: 'Plugin ID to disable', type: 'string', required: true },
      ],
    },
    {
      name: 'repo',
      description: 'Manage database plugin repositories',
      options: [
        { name: 'action', description: 'Repository action: add, list, or remove', type: 'string', required: true },
        { name: 'repository', description: 'GitHub repository (owner/repo)', type: 'string', required: false },
      ],
    },
    { name: 'reload', description: 'Reload all plugins from disk and database' },
  ],
  async execute(ctx: ExecuteContext) {
    const { message, interaction, args, getOption } = ctx;
    const guildId = ctx.interaction?.guildId || ctx.message?.guildId || null;
    const db = BotDatabase.getInstance();

    const reply = async (content: any) => {
      if (message) return message.reply(content);
      return interaction!.reply(content);
    };

    const editReply = async (msg: Message | any, content: any) => {
      if (isMessageResponse(msg)) return msg.edit(content);
      return interaction!.editReply(content);
    };

    const rawSub = getOption<string>('subcommand') || args[0];

    // Handle `>plugin repo <action>` or slash options
    if (rawSub === 'repo') {
      const action = getOption<string>('action') || args[1];
      const repoArg = getOption<string>('repository') || args[2];

      if (action === 'add' || action === 'install') {
        if (!repoArg) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'repository' })], ephemeral: true });
        }
        const waitMsg = await reply({ embeds: [createEmbed('config.plugin.install_embed', { repo: repoArg })] });
        try {
          const loaded = await fetchAndStorePluginRepo(repoArg, guildId);
          return editReply(waitMsg, {
            embeds: [
              createEmbed('config.plugin.install_success_embed', {
                count: String(loaded.length),
                repo: repoArg,
              }),
            ],
          });
        } catch (err: any) {
          return editReply(waitMsg, { embeds: [formatError('install_failed', { reason: err.message })] });
        }
      }

      if (action === 'remove' || action === 'delete') {
        if (!repoArg) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'repository' })], ephemeral: true });
        }
        const existing = db.getPluginRepository(repoArg, guildId);
        if (!existing) {
          return reply({ embeds: [formatError('repo_not_found', { repo: repoArg })] });
        }

        try {
          const config = JSON.parse(existing.configJson);
          if (Array.isArray(config.plugins)) {
            for (const p of config.plugins) {
              unregisterPlugin(p.id, guildId);
            }
          }
        } catch {}

        db.removePluginRepository(repoArg, guildId);
        return reply({ content: getMessage('config.plugin.repo_remove_success', { repo: repoArg }) });
      }

      // Default: list repos
      const repos = db.listPluginRepositories(guildId);
      if (repos.length === 0) {
        return reply({
          embeds: [
            createEmbed('config.plugin.repo_list_embed', {
              reposList: 'ℹ️ No custom plugin repositories are configured for this server.',
            }),
          ],
        });
      }

      const lines = repos.map((r) => {
        const status = r.enabled ? '🟢' : '🔴';
        const scope = r.guildId ? `Server (${r.guildId})` : 'Global';
        return `${status} \`${r.repoName}\` — [${scope}] (updated: ${r.updatedAt || 'n/a'})`;
      });

      return reply({
        embeds: [
          createEmbed('config.plugin.repo_list_embed', {
            reposList: lines.join('\n'),
          }),
        ],
      });
    }

    switch (rawSub) {
      case 'list': {
        const enabledIds = getEnabledPluginIds(guildId);
        const allPlugins = getAllPlugins(guildId);

        if (allPlugins.length === 0) {
          return reply({ embeds: [formatError('no_plugins_loaded')] });
        }

        const lines = allPlugins.map((p) => {
          const manifest = (p as any).manifest || {};
          const id = manifest.id || p.id || 'unknown';
          const version = manifest.version || p.version || '0.0.0';
          const name = manifest.name || p.name || id;
          const caps = (manifest.capabilities || p.capabilities)?.join(', ') || 'none';
          const enabled = enabledIds.includes(id) ? '🟢' : '🔴';
          return `${enabled} \`${id}\` v${version} — ${name} [${caps}]`;
        });

        const embed = createEmbed('config.plugin.list_embed', {
          pluginsList: lines.join('\n'),
        });
        return reply({ embeds: [embed] });
      }

      case 'install': {
        const repo = getOption<string>('repository') || args[1];
        if (!repo) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'repository' })], ephemeral: true });
        }

        const waitMsg = await reply({ embeds: [createEmbed('config.plugin.install_embed', { repo })] });

        try {
          const loaded = await fetchAndStorePluginRepo(repo, guildId);
          return editReply(waitMsg, {
            embeds: [
              createEmbed('config.plugin.install_success_embed', {
                count: String(loaded.length),
                repo,
              }),
            ],
          });
        } catch (err: any) {
          return editReply(waitMsg, { embeds: [formatError('install_failed', { reason: err.message })] });
        }
      }

      case 'remove': {
        const target = getOption<string>('identifier') || getOption<string>('plugin_id') || args[1];
        if (!target) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'identifier' })], ephemeral: true });
        }

        // 1. Check if target is a repo
        const existingRepo = db.getPluginRepository(target, guildId);
        if (existingRepo) {
          try {
            const config = JSON.parse(existingRepo.configJson);
            if (Array.isArray(config.plugins)) {
              for (const p of config.plugins) {
                unregisterPlugin(p.id, guildId);
              }
            }
          } catch {}
          db.removePluginRepository(target, guildId);
          return reply({ content: getMessage('config.plugin.repo_remove_success', { repo: target }) });
        }

        // 2. Check if target is a plugin ID
        const pluginInstance = getPlugin(target, guildId);
        if (!pluginInstance) {
          return reply({ embeds: [formatError('plugin_not_found', { name: target })] });
        }

        // Find and clean up repository from DB if present
        const repos = db.listPluginRepositories(guildId);
        for (const r of repos) {
          try {
            const config = JSON.parse(r.configJson);
            if (config.plugins?.some((p: any) => p.id === target)) {
              db.removePluginRepository(r.repoName, r.guildId);
              break;
            }
          } catch {}
        }

        unregisterPlugin(target, guildId);
        return reply({ content: getMessage('config.plugin.remove_success', { id: target }) });
      }

      case 'info': {
        const pluginId = getOption<string>('plugin_id') || args[1];
        if (!pluginId) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'plugin_id' })], ephemeral: true });
        }

        const pluginInstance = getPlugin(pluginId, guildId);
        if (!pluginInstance) {
          return reply({ embeds: [formatError('plugin_not_found', { name: pluginId })] });
        }

        const manifest = (pluginInstance as any).manifest || {};

        const embed = createEmbed('config.plugin.info_embed', {
          id: pluginId,
          name: manifest.name || pluginInstance.name || pluginId,
          version: manifest.version || pluginInstance.version || '0.0.0',
          author: manifest.author || 'Community',
          extensions: (manifest.fileExtensions || pluginInstance.fileExtensions)?.join(', ') || 'none',
          capabilities: (manifest.capabilities || pluginInstance.capabilities)?.join(', ') || 'none',
          description: manifest.description || 'No description provided',
        });

        return reply({ embeds: [embed] });
      }

      case 'enable': {
        const pluginId = getOption<string>('plugin_id') || args[1];
        if (!pluginId) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'plugin_id' })], ephemeral: true });
        }

        if (enablePlugin(pluginId, guildId)) {
          return reply({ content: getMessage('config.plugin.enable_success', { id: pluginId }) });
        } else {
          return reply({ embeds: [formatError('plugin_not_found', { name: pluginId })] });
        }
      }

      case 'disable': {
        const pluginId = getOption<string>('plugin_id') || args[1];
        if (!pluginId) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'plugin_id' })], ephemeral: true });
        }

        if (disablePlugin(pluginId, guildId)) {
          return reply({ content: getMessage('config.plugin.disable_success', { id: pluginId }) });
        } else {
          return reply({ embeds: [formatError('plugin_not_found', { name: pluginId })] });
        }
      }

      case 'reload': {
        await loadAllPlugins();
        const s = getRegistryStats(guildId);
        return reply({ content: `🔄 Reloaded language plugins. Active: ${s.enabled} plugin(s) (total ${s.total}).` });
      }

      default: {
        return reply({ embeds: [formatError('subcommand_not_found')] });
      }
    }
  },
};
