import type { AppDeps } from '../../app.js';
import { readBodyJson, sendError, sendJson } from '../http/helpers.js';
import type { Router } from '../http/router.js';
import { canUserManageGuild, requireDashboardUser } from './shared.js';
import { getAllCommands, isCommandDisabled } from '../../bot/handlers/registry.js';
import { loadAllCommands } from '../../bot/handlers/loader.js';

const FEATURE_NAMES = ['feeds', 'streamalerts', 'music', 'gifs'] as const;

export function registerGuildRoutes(router: Router<AppDeps>): void {
  router.add('GET', '/api/guilds', async (req, res, _ctx, d) => {
    const userId = await requireDashboardUser(req, res, d);
    if (userId === null) return;

    if (!d.bot) {
      sendJson(res, 200, { botEnabled: false, guilds: [] });
      return;
    }

    try {
      const allGuilds = await d.bot.getGuildsWithChannels();
      const guilds = allGuilds
        .filter((g) => canUserManageGuild(userId, g.id, d))
        .map((g) => ({ id: g.id, name: g.name, icon: g.icon }));
      sendJson(res, 200, { botEnabled: true, guilds });
    } catch (err) {
      sendError(res, 500, err instanceof Error ? err.message : 'Failed to fetch guilds');
    }
  });

  router.add('GET', '/api/guilds/:guildId/channels', async (req, res, ctx, d) => {
    const userId = await requireDashboardUser(req, res, d);
    if (userId === null) return;

    const guildId = ctx.params['guildId'];
    if (!guildId) return sendError(res, 400, 'guildId is required');
    if (!d.bot) return sendError(res, 400, 'Discord bot is not enabled');
    if (!canUserManageGuild(userId, guildId, d)) {
      return sendError(res, 403, 'Forbidden: You cannot manage this server.');
    }

    try {
      const allGuilds = await d.bot.getGuildsWithChannels();
      const guild = allGuilds.find((g) => g.id === guildId);
      if (!guild) return sendError(res, 404, 'Guild not found');

      const allChannels = await d.bot.getGuildChannelsAll(guildId).catch(() => []);
      const textChannels = allChannels
        .filter((ch) => ch.type === 0 || ch.type === 5)
        .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type }));
      const forumChannels = allChannels
        .filter((ch) => ch.type === 15)
        .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type }));

      sendJson(res, 200, {
        guildId,
        name: guild.name,
        icon: guild.icon,
        textChannels,
        forumChannels,
      });
    } catch (err) {
      sendError(res, 500, err instanceof Error ? err.message : 'Failed to fetch guild channels');
    }
  });

  router.add('GET', '/api/guilds/:guildId/settings', async (req, res, ctx, d) => {
    const userId = await requireDashboardUser(req, res, d);
    if (userId === null) return;

    const guildId = ctx.params['guildId'];
    if (!guildId) return sendError(res, 400, 'guildId is required');
    if (!d.bot) return sendError(res, 400, 'Discord bot is not enabled');
    if (!canUserManageGuild(userId, guildId, d)) {
      return sendError(res, 403, 'Forbidden: You cannot manage this server.');
    }

    try {
      const allGuilds = await d.bot.getGuildsWithChannels();
      const guild = allGuilds.find((g) => g.id === guildId);
      if (!guild) return sendError(res, 404, 'Guild not found');

      const roles = {
        djRoleId: d.repo.getGuildSetting(guildId, 'dj_role_id') || null,
        adminRoleId: d.repo.getGuildSetting(guildId, 'admin_role_id') || null,
      };
      const prefix = d.repo.getGuildSetting(guildId, 'prefix') || null;
      const features: Record<string, boolean> = {};
      for (const name of FEATURE_NAMES) {
        features[name] = d.repo.getGuildSetting(guildId, `feature_${name}`) === '1';
      }

      const guildRoles = await d.bot.getGuildRoles(guildId);
      const allChannels = await d.bot.getGuildChannelsAll(guildId).catch(() => []);
      const textChannels = allChannels
        .filter((ch) => ch.type === 0 || ch.type === 5)
        .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type }));
      const forumChannels = allChannels
        .filter((ch) => ch.type === 15)
        .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type }));

      await loadAllCommands();
      const allCommands = getAllCommands();
      const commands = allCommands.map((c) => ({
        name: c.def.name,
        category: c.category,
        description: c.def.description,
        disabled: isCommandDisabled(guildId, c.def.name, d),
      }));

      sendJson(res, 200, {
        guildId,
        name: guild.name,
        icon: guild.icon,
        roles,
        prefix,
        features,
        commands,
        guildRoles,
        textChannels,
        forumChannels,
      });
    } catch (err) {
      sendError(res, 500, err instanceof Error ? err.message : 'Failed to fetch guild settings');
    }
  });

  router.add('PUT', '/api/guilds/:guildId/settings', async (req, res, ctx, d) => {
    const userId = await requireDashboardUser(req, res, d);
    if (userId === null) return;

    const guildId = ctx.params['guildId'];
    if (!guildId) return sendError(res, 400, 'guildId is required');
    if (!d.bot) return sendError(res, 400, 'Discord bot is not enabled');
    if (!canUserManageGuild(userId, guildId, d)) {
      return sendError(res, 403, 'Forbidden: You cannot manage this server.');
    }

    const body = (await readBodyJson(req)) as {
      djRoleId?: string | null;
      adminRoleId?: string | null;
      prefix?: string | null;
      features?: Record<string, boolean>;
      commands?: Record<string, boolean>;
    };

    try {
      const guildRoles = await d.bot.getGuildRoles(guildId);
      const roleIds = new Set(guildRoles.map((r) => r.id));

      if (body.djRoleId) {
        const id = String(body.djRoleId).trim();
        if (!roleIds.has(id)) return sendError(res, 400, 'DJ role is not a valid role in this server.');
      }
      if (body.adminRoleId) {
        const id = String(body.adminRoleId).trim();
        if (!roleIds.has(id)) return sendError(res, 400, 'Admin role is not a valid role in this server.');
      }

      const validFeatureNames = FEATURE_NAMES as readonly string[];
      const changes: string[] = [];

      if (body.djRoleId !== undefined) {
        const value = body.djRoleId ? String(body.djRoleId).trim() : '';
        d.repo.setGuildSetting(guildId, 'dj_role_id', value);
        changes.push(`DJ role → ${value ? `<@&${value}>` : 'cleared'}`);
      }
      if (body.adminRoleId !== undefined) {
        const value = body.adminRoleId ? String(body.adminRoleId).trim() : '';
        d.repo.setGuildSetting(guildId, 'admin_role_id', value);
        changes.push(`Admin role → ${value ? `<@&${value}>` : 'cleared'}`);
      }

      if (body.prefix !== undefined) {
        const value = (body.prefix ?? '').trim().slice(0, 16);
        d.repo.setGuildSetting(guildId, 'prefix', value);
        changes.push(value ? `Prefix → \`${value}\`` : 'Prefix cleared');
      }

      if (body.features) {
        for (const [name, enabled] of Object.entries(body.features)) {
          if (!(validFeatureNames as readonly string[]).includes(name)) {
            return sendError(res, 400, `Unknown feature "${name}".`);
          }
          d.repo.setGuildSetting(guildId, `feature_${name}`, enabled ? '1' : '0');
          changes.push(`${name} ${enabled ? 'enabled' : 'disabled'}`);
        }
      }

      if (body.commands) {
        for (const [name, enabled] of Object.entries(body.commands)) {
          const cmdName = name.toLowerCase().replace(/^\//, '');
          d.repo.setGuildSetting(guildId, `cmd_disabled_${cmdName}`, enabled ? '0' : '1');
          changes.push(`command /${cmdName} ${enabled ? 'enabled' : 'disabled'}`);
        }
      }

      d.repo.logActivity(
        userId,
        'info',
        'guild-settings',
        `Updated guild "${guildId}" settings: ${changes.join('; ') || 'no changes'}.`,
      );
      sendJson(res, 200, { ok: true, changes });
    } catch (err) {
      sendError(res, 500, err instanceof Error ? err.message : 'Failed to update guild settings');
    }
  });
}
