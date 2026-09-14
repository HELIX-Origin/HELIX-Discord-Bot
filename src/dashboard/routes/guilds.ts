import type { AppDeps } from '../../app.js';
import { readBodyJson, sendError, sendJson } from '../http/helpers.js';
import type { Router } from '../http/router.js';
import { canUserManageGuild, requireDashboardUser } from './shared.js';
import type { FeedCategory } from '../../state/types.js';

const VALID_CATEGORIES: FeedCategory[] = ['rss', 'reddit', 'freegames', 'streamalerts'];

const FEATURE_NAMES = ['feeds', 'streamalerts', 'threads', 'music', 'gifs'] as const;

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

  router.add('GET', '/api/guilds/:guildId/categories', async (req, res, ctx, d) => {
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

      const targets = d.repo.getGuildCategoryTargets(guildId);
      const categories = VALID_CATEGORIES.map((category) => {
        const target = targets.find((t) => t.category === category);
        return {
          category,
          channelId: target?.channelId ?? null,
          threadChannelId: target?.threadChannelId ?? null,
        };
      });

      sendJson(res, 200, {
        guildId,
        name: guild.name,
        icon: guild.icon,
        categories,
        textChannels,
        forumChannels,
      });
    } catch (err) {
      sendError(res, 500, err instanceof Error ? err.message : 'Failed to fetch guild categories');
    }
  });

  router.add('PUT', '/api/guilds/:guildId/categories/:category', async (req, res, ctx, d) => {
    const userId = await requireDashboardUser(req, res, d);
    if (userId === null) return;

    const guildId = ctx.params['guildId'];
    const category = ctx.params['category'];
    if (!guildId) return sendError(res, 400, 'guildId is required');
    if (!VALID_CATEGORIES.includes(category as FeedCategory)) {
      return sendError(res, 400, 'Invalid category. Must be rss, reddit, freegames, or streamalerts.');
    }
    if (!d.bot) return sendError(res, 400, 'Discord bot is not enabled');
    if (!canUserManageGuild(userId, guildId, d)) {
      return sendError(res, 403, 'Forbidden: You cannot manage this server.');
    }

    const body = (await readBodyJson(req)) as {
      channelId?: string | null;
      threadChannelId?: string | null;
    };

    const channelId = body.channelId === undefined ? null : body.channelId ? String(body.channelId).trim() : null;
    const threadChannelId =
      body.threadChannelId === undefined ? null : body.threadChannelId ? String(body.threadChannelId).trim() : null;

    try {
      const allChannels = await d.bot.getGuildChannelsAll(guildId).catch(() => []);
      const validTextIds = new Set(allChannels.filter((ch) => ch.type === 0 || ch.type === 5).map((ch) => ch.id));
      const validForumIds = new Set(allChannels.filter((ch) => ch.type === 15).map((ch) => ch.id));

      if (channelId && !validTextIds.has(channelId)) {
        return sendError(res, 400, `Channel ${channelId} is not a valid text channel in this server.`);
      }
      if (threadChannelId && !validForumIds.has(threadChannelId)) {
        return sendError(res, 400, `Channel ${threadChannelId} is not a valid forum channel in this server.`);
      }

      const updated = d.repo.setGuildCategoryTarget(guildId, category as FeedCategory, channelId, threadChannelId);
      d.repo.logActivity(
        userId,
        'info',
        'guild-categories',
        `Updated ${category} target for guild "${guildId}" (channel=${channelId ?? 'none'}, thread=${threadChannelId ?? 'none'}).`,
      );
      sendJson(res, 200, updated);
    } catch (err) {
      sendError(res, 500, err instanceof Error ? err.message : 'Failed to save category target');
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

      const binding = d.repo.getGuildBinding(guildId);
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

      const targets = d.repo.getGuildCategoryTargets(guildId);
      const categories = VALID_CATEGORIES.map((category) => {
        const target = targets.find((t) => t.category === category);
        return {
          category,
          channelId: target?.channelId ?? null,
          threadChannelId: target?.threadChannelId ?? null,
        };
      });

      sendJson(res, 200, {
        guildId,
        name: guild.name,
        icon: guild.icon,
        threadsEnabled: Boolean(binding?.threadsEnabled),
        forumChannelIds: binding?.forumChannelIds ?? [],
        roles,
        prefix,
        features,
        guildRoles,
        categories,
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
      threadsEnabled?: boolean;
      forumChannelIds?: string[];
    };

    try {
      const guildRoles = await d.bot.getGuildRoles(guildId);
      const roleIds = new Set(guildRoles.map((r) => r.id));
      const allChannels = await d.bot.getGuildChannelsAll(guildId).catch(() => []);
      const forumIds = new Set(allChannels.filter((ch) => ch.type === 15).map((ch) => ch.id));

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

        if (typeof body.features['threads'] === 'boolean') {
          const binding = d.repo.getGuildBinding(guildId);
          d.repo.setGuildThreadConfig(guildId, {
            threadsEnabled: body.features['threads'],
            forumChannelIds: binding?.forumChannelIds ?? [],
          });
        }
      }

      if (body.threadsEnabled !== undefined || body.forumChannelIds !== undefined) {
        const forumChannelIds = Array.isArray(body.forumChannelIds)
          ? body.forumChannelIds.map((id) => String(id).trim()).filter((id) => id.length > 0)
          : (d.repo.getGuildBinding(guildId)?.forumChannelIds ?? []);
        const unknown = forumChannelIds.filter((id) => !forumIds.has(id));
        if (unknown.length > 0) {
          return sendError(res, 400, `Forum channel ${unknown[0]} is not a valid forum channel in this server.`);
        }
        const threadsEnabled =
          body.threadsEnabled !== undefined
            ? Boolean(body.threadsEnabled)
            : Boolean(d.repo.getGuildBinding(guildId)?.threadsEnabled);
        d.repo.setGuildThreadConfig(guildId, { threadsEnabled, forumChannelIds });
        d.repo.setGuildSetting(guildId, 'feature_threads', threadsEnabled ? '1' : '0');
        changes.push(
          `Thread delivery ${threadsEnabled ? 'enabled' : 'disabled'} (${forumChannelIds.length} forum channel${forumChannelIds.length === 1 ? '' : 's'})`,
        );
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
