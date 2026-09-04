import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';
import type { CommandDefinition, ExecuteContext } from '../../types/command.js';
import { getMessage, createEmbed, formatError } from '../../handlers/message-handler.js';
import { registerPlugins, getAllPlugins, getEnabledPluginIds, getPlugin, enablePlugin, disablePlugin, unregisterPlugin, getRegistryStats } from '../../plugins/registry.js';
import { loadCommunityPlugins, loadAllPlugins } from '../../plugins/plugin-loader.js';
import { BOT_ROOT_DIR } from '../../env.js';
import fs from 'fs';
import path from 'path';

const PLUGINS_DIR = path.resolve(BOT_ROOT_DIR, 'src', 'plugins');
const COMMUNITY_DIR = path.join(PLUGINS_DIR, 'community');

function isMessageResponse(res: Message | any): res is Message {
  return res && typeof res.edit === 'function' && 'channelId' in res;
}

export const plugin: CommandDefinition = {
  name: 'plugin',
  description: 'Manage language plugins',
  category: 'plugins',
  subcommands: [
    { name: 'list', description: 'List installed plugins' },
    { name: 'install', description: 'Install plugin from GitHub', options: [
      { name: 'repository', description: 'GitHub repository (owner/repo)', type: 'string', required: true }
    ]},
    { name: 'remove', description: 'Remove installed plugin', options: [
      { name: 'plugin_id', description: 'Plugin ID to remove', type: 'string', required: true }
    ]},
    { name: 'info', description: 'Show plugin details', options: [
      { name: 'plugin_id', description: 'Plugin ID', type: 'string', required: true }
    ]},
    { name: 'enable', description: 'Enable a plugin', options: [
      { name: 'plugin_id', description: 'Plugin ID to enable', type: 'string', required: true }
    ]},
    { name: 'disable', description: 'Disable a plugin', options: [
      { name: 'plugin_id', description: 'Plugin ID to disable', type: 'string', required: true }
    ]},
    { name: 'reload', description: 'Reload all plugins' },
  ],
  async execute(ctx: ExecuteContext) {
    const { message, interaction, args, getOption } = ctx;

    const reply = async (content: any) => {
      if (message) return message.reply(content);
      return interaction!.reply(content);
    };

    const editReply = async (msg: Message | any, content: any) => {
      if (isMessageResponse(msg)) return msg.edit(content);
      return interaction!.editReply(content);
    };

    const sub = getOption<string>('subcommand') || args[0];

    switch (sub) {
      case 'list': {
        const stats = getRegistryStats();
        const enabledIds = getEnabledPluginIds();
        const allPlugins = getAllPlugins();

        if (allPlugins.length === 0) {
          return reply({ embeds: [formatError('no_plugins_loaded')] });
        }

        const lines = allPlugins.map(p => {
          const manifest = (p as any).manifest || {};
          const id = manifest.id || 'unknown';
          const version = manifest.version || '0.0.0';
          const name = manifest.name || id;
          const caps = manifest.capabilities?.join(', ') || 'none';
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

        if (!fs.existsSync(COMMUNITY_DIR)) {
          fs.mkdirSync(COMMUNITY_DIR, { recursive: true });
        }

        const repoName = repo.replace('/', '-');
        const targetDir = path.join(COMMUNITY_DIR, repoName);

        if (fs.existsSync(targetDir)) {
          return reply({ embeds: [formatError(`Repository \`${repo}\` is already cloned locally.`)] });
        }

        const waitMsg = await reply({ embeds: [createEmbed('config.plugin.install_embed', { repo })] });

        try {
          const { execSync } = await import('child_process');
          execSync(`git clone --depth 1 https://github.com/${repo}.git "${targetDir}"`, {
            stdio: 'pipe',
            timeout: 60000,
          });

          const loaded = await loadCommunityPlugins(targetDir);
          registerPlugins(loaded);

          return editReply(waitMsg, { embeds: [createEmbed('config.plugin.install_success_embed', { count: String(loaded.length), repo })] });
        } catch (err: any) {
          if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
          }
          return editReply(waitMsg, { embeds: [formatError('install_failed', { reason: err.message })] });
        }
      }

      case 'remove': {
        const pluginId = getOption<string>('plugin_id') || args[1];
        if (!pluginId) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'plugin_id' })], ephemeral: true });
        }

        const plugin = getPlugin(pluginId);
        if (!plugin) {
          return reply({ embeds: [formatError('plugin_not_found', { name: pluginId })] });
        }

        const communityRepos = fs.existsSync(COMMUNITY_DIR)
          ? fs.readdirSync(COMMUNITY_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
          : [];

        let removed = false;
        for (const repoName of communityRepos) {
          const repoDir = path.join(COMMUNITY_DIR, repoName);
          const configPath = path.join(repoDir, 'config.json');
          if (fs.existsSync(configPath)) {
            try {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
              if (config.plugins?.some((p: any) => p.id === pluginId)) {
                fs.rmSync(repoDir, { recursive: true, force: true });
                removed = true;
                break;
              }
            } catch {}
          }
        }

        unregisterPlugin(pluginId);

        if (removed) {
          return reply({ content: getMessage('config.plugin.remove_success', { id: pluginId }) });
        } else {
          return reply({ embeds: [formatError('plugin_not_found', { name: pluginId })] });
        }
      }

      case 'info': {
        const pluginId = getOption<string>('plugin_id') || args[1];
        if (!pluginId) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'plugin_id' })], ephemeral: true });
        }

        const plugin = getPlugin(pluginId);
        if (!plugin) {
          return reply({ embeds: [formatError('plugin_not_found', { name: pluginId })] });
        }

        const manifest = (plugin as any).manifest || {};

        const embed = createEmbed('config.plugin.info_embed', {
          id: pluginId,
          name: manifest.name || pluginId,
          version: manifest.version || '0.0.0',
          author: manifest.author || 'Community',
          extensions: manifest.fileExtensions?.join(', ') || 'none',
          capabilities: manifest.capabilities?.join(', ') || 'none',
          description: manifest.description || 'No description provided',
        });

        return reply({ embeds: [embed] });
      }

      case 'enable': {
        const pluginId = getOption<string>('plugin_id') || args[1];
        if (!pluginId) {
          return reply({ embeds: [formatError('missing_argument', { arg: 'plugin_id' })], ephemeral: true });
        }

        if (enablePlugin(pluginId)) {
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

        if (disablePlugin(pluginId)) {
          return reply({ content: getMessage('config.plugin.disable_success', { id: pluginId }) });
        } else {
          return reply({ embeds: [formatError('plugin_not_found', { name: pluginId })] });
        }
      }

      case 'reload': {
        const loaded = await loadAllPlugins();
        registerPlugins(loaded);

        const s = getRegistryStats();
        return reply({ content: `🔄 Reloaded language plugins. Active: ${s.enabled} plugin(s).` });
      }

      default: {
        return reply({ embeds: [formatError('subcommand_not_found')] });
      }
    }
  },
};