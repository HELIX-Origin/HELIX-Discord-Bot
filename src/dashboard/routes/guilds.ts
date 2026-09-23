import type { AppDeps } from '../../app.js';
import { readBodyJson, sendError, sendJson } from '../http/helpers.js';
import type { Router } from '../http/router.js';
import { canUserManageGuild, getUserGuilds, isAdminOrOwner, requireDashboardUser } from './shared.js';
import { hasInvitePermission } from '../oauth/discord.js';
import { getAllCommands, isCommandDisabled } from '../../bot/handlers/registry.js';
import { loadAllCommands } from '../../bot/handlers/loader.js';
import { getWelcomeConfig } from '../../bot/commands/admin/welcome.js';
import {
  DEFAULT_TICKET_MESSAGE,
  getTicketConfig,
  renderTicketMessage,
  sendTicketButtonMessage,
} from '../../bot/commands/admin/ticket.js';
import { parseModLogEvents, MOD_ACTIONS } from '../../bot/lib/admin/modlog.js';
import { AUDIT_EVENTS, dispatchAuditLog, parseAuditEvents } from '../../bot/lib/admin/auditlog.js';

const FEATURE_NAMES = ['feeds', 'streamalerts'] as const;

function buildInviteUrl(clientId: string, guildId?: string): string {
  const base = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&scope=bot%20applications.commands&permissions=586263558272`;
  return guildId ? `${base}&guild_id=${encodeURIComponent(guildId)}` : base;
}

export function registerGuildRoutes(router: Router<AppDeps>): void {
  router.add('GET', '/api/guilds', async (req, res, _ctx, d) => {
    const userId = await requireDashboardUser(req, res, d);
    if (userId === null) return;

    const botGuilds = d.bot ? await d.bot.getGuildsWithChannels().catch(() => []) : [];

    try {
      // Every guild the user belongs to (captured at Discord login), merged with bot guilds.
      const storedGuilds = getUserGuilds(userId, d);
      const botGuildMap = new Map(botGuilds.map((g) => [g.id, g]));
      const seen = new Set<string>();

      const guilds = storedGuilds.map((g) => {
        seen.add(g.id);
        const canManage = canUserManageGuild(userId, g.id, d);
        const canInvite = hasInvitePermission(g);
        const inBot = botGuildMap.has(g.id);
        return {
          id: g.id,
          name: g.name,
          icon: g.icon,
          botIn: inBot,
          canManage,
          canInvite: canInvite && !inBot,
          inviteUrl: canInvite && !inBot && d.config.clientId ? buildInviteUrl(d.config.clientId, g.id) : null,
        };
      });

      // Add any bot guilds not in the user's stored guild list (only app-team/owners may see those).
      if (isAdminOrOwner(userId, d)) {
        for (const g of botGuilds) {
          if (seen.has(g.id)) continue;
          guilds.push({
            id: g.id,
            name: g.name,
            icon: g.icon,
            botIn: true,
            canManage: true,
            canInvite: false,
            inviteUrl: null,
          });
        }
      }

      sendJson(res, 200, { botEnabled: Boolean(d.bot), guilds });
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

    const canManage = canUserManageGuild(userId, guildId, d);
    if (!canManage) {
      return sendError(res, 403, 'Forbidden: You cannot manage this server.');
    }

    try {
      const allGuilds = await d.bot.getGuildsWithChannels();
      const guild = allGuilds.find((g) => g.id === guildId);
      if (!guild) return sendError(res, 404, 'Guild not found');

      const allChannels = await d.bot.getGuildChannelsAll(guildId).catch(() => []);
      const textChannels = allChannels
        .filter((ch) => ch.type === 0 || ch.type === 5)
        .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type, nsfw: ch.nsfw ?? false }));

      sendJson(res, 200, {
        guildId,
        name: guild.name,
        icon: guild.icon,
        canManage,
        textChannels,
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
        adminRoleId: d.repo.getGuildSetting(guildId, 'admin_role_id') || null,
      };
      const prefix = d.repo.getGuildSetting(guildId, 'prefix') || null;
      const features: Record<string, boolean> = {};
      for (const name of FEATURE_NAMES) {
        features[name] = d.repo.getGuildSetting(guildId, `feature_${name}`) === '1';
      }

      const welcome = getWelcomeConfig(d, guildId);
      const ticket = getTicketConfig(d, guildId);
      const logs = {
        auditLogChannelId: d.repo.getGuildSetting(guildId, 'audit_log_channel_id') || null,
        auditLogEvents: Array.from(parseAuditEvents(d.repo.getGuildSetting(guildId, 'audit_log_events'))),
        modLogChannelId: d.repo.getGuildSetting(guildId, 'mod_log_channel_id') || null,
        modLogEvents: Array.from(parseModLogEvents(d.repo.getGuildSetting(guildId, 'mod_log_events'))),
      };

      const guildRoles = await d.bot.getGuildRoles(guildId);
      const allChannels = await d.bot.getGuildChannelsAll(guildId).catch(() => []);
      const textChannels = allChannels
        .filter((ch) => ch.type === 0 || ch.type === 5)
        .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type, nsfw: ch.nsfw ?? false }));
      const threadsEnabled = d.repo.getGuildBinding(guildId)?.threadsEnabled === 1;

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
        welcome,
        tickets: ticket,
        logs,
        commands,
        guildRoles,
        textChannels,
        threadsEnabled,
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
      adminRoleId?: string | null;
      prefix?: string | null;
      features?: Record<string, boolean>;
      commands?: Record<string, boolean>;
      welcome?: {
        channelId?: string | null;
        message?: string | null;
        embed?: boolean;
        color?: string | null;
        thumbnail?: boolean;
        banner?: string | null;
      };
      tickets?: {
        channelId?: string | null;
        managerRoleId?: string | null;
        transcriptChannelId?: string | null;
        logChannelId?: string | null;
        message?: string | null;
        ticketMessage?: string | null;
        welcomeMessage?: string | null;
        embed?: boolean;
        color?: string | null;
      };
      logs?: {
        auditLogChannelId?: string | null;
        auditLogEvents?: string[];
        modLogChannelId?: string | null;
        modLogEvents?: string[];
      };
      threadsEnabled?: boolean;
    };

    try {
      const guildRoles = await d.bot.getGuildRoles(guildId);
      const roleIds = new Set(guildRoles.map((r) => r.id));
      const allChannels = await d.bot.getGuildChannelsAll(guildId).catch(() => []);
      const channelIds = new Set(allChannels.map((c) => c.id));
      const allUserGuilds = await d.bot.getGuildsWithChannels().catch(() => []);
      const guild = allUserGuilds.find((g) => g.id === guildId) ?? {
        id: guildId,
        name: 'this server',
        icon: null,
      };
      const guildName = guild.name ?? 'this server';

      if (body.adminRoleId) {
        const id = String(body.adminRoleId).trim();
        if (!roleIds.has(id)) return sendError(res, 400, 'Admin role is not a valid role in this server.');
      }

      const validFeatureNames = FEATURE_NAMES as readonly string[];
      const changes: string[] = [];

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

      const eventConfigs: Array<{
        list: readonly string[];
        raw: string[] | undefined;
        key: string;
        label: string;
      }> = [
        { list: AUDIT_EVENTS, raw: body.logs?.auditLogEvents, key: 'audit_log_events', label: 'audit event' },
        { list: MOD_ACTIONS, raw: body.logs?.modLogEvents, key: 'mod_log_events', label: 'mod log event' },
      ];
      for (const item of eventConfigs) {
        if (item.raw === undefined) continue;
        const unknown = item.raw.filter((v) => !(item.list as readonly string[]).includes(v));
        if (unknown.length > 0) {
          return sendError(res, 400, `Unknown ${item.label}(s): ${unknown.join(', ')}.`);
        }
        const value = item.raw.join(',');
        d.repo.setGuildSetting(guildId, item.key, value);
        changes.push(`${item.key} → ${value || 'all'}`);
      }

      if (body.welcome) {
        if (body.welcome.channelId) {
          const id = String(body.welcome.channelId).trim();
          if (!channelIds.has(id)) return sendError(res, 400, 'Welcome channel is not a valid channel in this server.');
          d.repo.setGuildSetting(guildId, 'welcome_channel_id', id);
          changes.push(`Welcome channel → <#${id}>`);
        } else if (body.welcome.channelId === null || body.welcome.channelId === '') {
          d.repo.setGuildSetting(guildId, 'welcome_channel_id', '');
          changes.push('Welcome channel cleared');
        }
        if (body.welcome.message !== undefined) {
          const value = (body.welcome.message ?? '').slice(0, 2000);
          d.repo.setGuildSetting(guildId, 'welcome_message', value);
          changes.push('Welcome message updated');
        }
        if (body.welcome.embed !== undefined) {
          d.repo.setGuildSetting(guildId, 'welcome_embed', body.welcome.embed ? '1' : '0');
          changes.push(`Welcome format → ${body.welcome.embed ? 'embed' : 'plain text'}`);
        }
        if (body.welcome.color !== undefined) {
          const value = (body.welcome.color ?? '').trim().replace(/^#/, '');
          if (value && !/^[0-9a-fA-F]{6}$/.test(value)) {
            return sendError(res, 400, 'Welcome color must be a hex color like #06b6d4.');
          }
          d.repo.setGuildSetting(guildId, 'welcome_color', value ? `#${value}` : '');
          changes.push(value ? `Welcome color → #${value}` : 'Welcome color cleared');
        }
        if (body.welcome.thumbnail !== undefined) {
          d.repo.setGuildSetting(guildId, 'welcome_thumbnail', body.welcome.thumbnail ? '1' : '0');
          changes.push(`Welcome thumbnail ${body.welcome.thumbnail ? 'shown' : 'hidden'}`);
        }
        if (body.welcome.banner !== undefined) {
          const value = (body.welcome.banner ?? '').trim();
          d.repo.setGuildSetting(guildId, 'welcome_banner', value);
          changes.push(value ? 'Welcome banner set' : 'Welcome banner cleared');
        }
      }

      if (body.tickets) {
        if (body.tickets.channelId) {
          const id = String(body.tickets.channelId).trim();
          if (!channelIds.has(id)) return sendError(res, 400, 'Ticket channel is not a valid channel in this server.');
          d.repo.setGuildSetting(guildId, 'ticket_channel_id', id);
          d.repo.setGuildSetting(guildId, 'ticket_category_id', '');
          changes.push(`Ticket channel → <#${id}>`);
        } else if (body.tickets.channelId === null || body.tickets.channelId === '') {
          d.repo.setGuildSetting(guildId, 'ticket_channel_id', '');
          d.repo.setGuildSetting(guildId, 'ticket_category_id', '');
          changes.push('Ticket channel cleared');
        }
        if (body.tickets.managerRoleId) {
          const id = String(body.tickets.managerRoleId).trim();
          if (!roleIds.has(id)) return sendError(res, 400, 'Ticket manager role is not a valid role in this server.');
          d.repo.setGuildSetting(guildId, 'ticket_manager_role_id', id);
          changes.push(`Ticket manager → <@&${id}>`);
        } else if (body.tickets.managerRoleId === null || body.tickets.managerRoleId === '') {
          d.repo.setGuildSetting(guildId, 'ticket_manager_role_id', '');
          changes.push('Ticket manager role cleared');
        }
        if (body.tickets.transcriptChannelId !== undefined) {
          const id = (body.tickets.transcriptChannelId ?? '').trim();
          if (id && !channelIds.has(id))
            return sendError(res, 400, 'Transcript channel is not a valid channel in this server.');
          d.repo.setGuildSetting(guildId, 'ticket_transcript_channel_id', id);
          changes.push(id ? `Transcript channel → <#${id}>` : 'Transcript channel cleared');
        }
        if (body.tickets.logChannelId !== undefined) {
          const id = (body.tickets.logChannelId ?? '').trim();
          if (id && !channelIds.has(id))
            return sendError(res, 400, 'Ticket log channel is not a valid channel in this server.');
          d.repo.setGuildSetting(guildId, 'ticket_log_channel_id', id);
          changes.push(id ? `Ticket log channel → <#${id}>` : 'Ticket log channel cleared');
        }
        const ticketMsgInput = body.tickets.message ?? body.tickets.ticketMessage ?? body.tickets.welcomeMessage;
        if (ticketMsgInput !== undefined) {
          const value = (ticketMsgInput ?? '').slice(0, 2000);
          d.repo.setGuildSetting(guildId, 'ticket_message', value);
          d.repo.setGuildSetting(guildId, 'ticket_welcome_message', value);
          changes.push('Ticket message updated');
        }
        if (body.tickets.embed !== undefined) {
          d.repo.setGuildSetting(guildId, 'ticket_embed', body.tickets.embed ? '1' : '0');
          changes.push(`Ticket format → ${body.tickets.embed ? 'Embed' : 'Plain text'}`);
        }
        if (body.tickets.color !== undefined) {
          d.repo.setGuildSetting(guildId, 'ticket_color', (body.tickets.color ?? '').trim());
        }

        const activeChanId = body.tickets.channelId || d.repo.getGuildSetting(guildId, 'ticket_channel_id');
        if (
          activeChanId &&
          (body.tickets.channelId ||
            ticketMsgInput !== undefined ||
            body.tickets.embed !== undefined ||
            body.tickets.color !== undefined) &&
          d.bot
        ) {
          const rawMsg = d.repo.getGuildSetting(guildId, 'ticket_message') || DEFAULT_TICKET_MESSAGE;
          const isEmbed = d.repo.getGuildSetting(guildId, 'ticket_embed') === '1';
          const rawColor = d.repo.getGuildSetting(guildId, 'ticket_color');
          const cleaned = (rawColor ?? '').trim().replace(/^#/, '');
          const color = /^[0-9a-fA-F]{6}$/.test(cleaned) ? parseInt(cleaned, 16) : null;
          const binding = d.repo.getGuildBinding(guildId);
          const serverName = (binding?.name || '').trim() || 'this server';
          const memberCount =
            typeof d.bot.getGuildMemberCount === 'function' ? ((await d.bot.getGuildMemberCount(guildId)) ?? '?') : '?';
          const managerRoleId = d.repo.getGuildSetting(guildId, 'ticket_manager_role_id');
          const msg = renderTicketMessage(rawMsg, {
            server: serverName,
            membercount: memberCount,
            role: managerRoleId ? `<@&${managerRoleId}>` : '@Support',
            channel: `<#${activeChanId}>`,
            user: 'Member',
            mention: '@Member',
          });
          void sendTicketButtonMessage(d.bot.rest, activeChanId, msg, { embed: isEmbed, color }).catch(() => {});
        }
      }

      if (body.logs) {
        if (body.logs.auditLogChannelId !== undefined) {
          const id = (body.logs.auditLogChannelId ?? '').trim();
          if (id && !channelIds.has(id))
            return sendError(res, 400, 'Audit log channel is not a valid channel in this server.');
          d.repo.setGuildSetting(guildId, 'audit_log_channel_id', id);
          changes.push(id ? `Audit log channel → <#${id}>` : 'Audit log channel cleared');
        }
        if (body.logs.modLogChannelId !== undefined) {
          const id = (body.logs.modLogChannelId ?? '').trim();
          if (id && !channelIds.has(id))
            return sendError(res, 400, 'Mod log channel is not a valid channel in this server.');
          d.repo.setGuildSetting(guildId, 'mod_log_channel_id', id);
          changes.push(id ? `Mod log channel → <#${id}>` : 'Mod log channel cleared');
        }
      }

      if (body.threadsEnabled !== undefined) {
        const enabled = Boolean(body.threadsEnabled);
        d.repo.setGuildThreadConfig(guildId, { threadsEnabled: enabled });
        changes.push(`Thread delivery ${enabled ? 'enabled' : 'disabled'}`);
      }

      d.repo.logActivity(
        userId,
        'info',
        'guild-settings',
        `Updated guild "${guildId}" settings: ${changes.join('; ') || 'no changes'}.`,
      );

      if (changes.length > 0) {
        void dispatchAuditLog(
          guildId,
          {
            event: 'settings',
            message: changes.join('; '),
            guildName: guildName,
            actorId: String(userId),
            actorTag: 'Dashboard',
          },
          d,
        );
      }

      sendJson(res, 200, { ok: true, changes });
    } catch (err) {
      sendError(res, 500, err instanceof Error ? err.message : 'Failed to update guild settings');
    }
  });

  router.add('POST', '/api/guilds/:guildId/poll', async (req, res, ctx, d) => {
    const userId = await requireDashboardUser(req, res, d);
    if (userId === null) return;
    const guildId = ctx.params['guildId'];
    if (!guildId) return sendError(res, 400, 'guildId is required');
    if (!canUserManageGuild(userId, guildId, d)) {
      return sendError(res, 403, 'Forbidden: You cannot manage feeds in this server.');
    }

    try {
      const count = await d.feeds.pollGuildFeeds(guildId, true);
      d.repo.logActivity(
        userId,
        'info',
        'feeds',
        `Manually triggered check for ${count} feeds/alerts in guild ${guildId}`,
      );
      sendJson(res, 200, { ok: true, polledCount: count, guildId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      sendError(res, 500, `Failed to poll guild feeds: ${msg}`);
    }
  });
}
