import type { AppDeps } from '../../app.js';
import { readBodyJson, sendError, sendJson } from '../http/helpers.js';
import type { Router } from '../http/router.js';
import { canUserManageGuild, requireDashboardUser } from './shared.js';

export function registerMusicRoutes(router: Router<AppDeps>): void {
  router.add('GET', '/api/guilds/:guildId/music', async (req, res, ctx, d) => {
    const userId = await requireDashboardUser(req, res, d);
    if (userId === null) return;

    const guildId = ctx.params['guildId'];
    if (!guildId) return sendError(res, 400, 'guildId is required');
    if (!d.config.features.nodeLinkEnabled) return sendError(res, 400, 'Music features are disabled.');
    if (!d.bot) return sendError(res, 400, 'Discord bot is not enabled');
    if (!canUserManageGuild(userId, guildId, d)) {
      return sendError(res, 403, 'Forbidden: You cannot manage this server.');
    }

    const manager = d.nodeLinkManager ?? null;
    if (!manager) return sendError(res, 503, 'NodeLink manager not initialized.');

    try {
      const player = await manager.getPlayer(guildId);
      if (!player) {
        sendJson(res, 200, { active: false, connected: manager.isConnected() });
        return;
      }
      sendJson(res, 200, {
        active: true,
        connected: manager.isConnected(),
        channelId: player.channelId,
        paused: player.paused,
        volume: player.volume,
        loop: player.loop,
        shuffled: player.shuffled,
        position: player.position,
        current: player.current,
        queue: player.queue,
      });
    } catch (err) {
      sendError(res, 500, err instanceof Error ? err.message : 'Failed to fetch player state');
    }
  });

  router.add('POST', '/api/guilds/:guildId/music/:action', async (req, res, ctx, d) => {
    const userId = await requireDashboardUser(req, res, d);
    if (userId === null) return;

    const guildId = ctx.params['guildId'];
    const action = ctx.params['action'];
    if (!guildId) return sendError(res, 400, 'guildId is required');
    if (!action) return sendError(res, 400, 'action is required');
    if (!d.config.features.nodeLinkEnabled) return sendError(res, 400, 'Music features are disabled.');
    if (!d.bot) return sendError(res, 400, 'Discord bot is not enabled');
    if (!canUserManageGuild(userId, guildId, d)) {
      return sendError(res, 403, 'Forbidden: You cannot manage this server.');
    }

    const manager = d.nodeLinkManager ?? null;
    if (!manager) return sendError(res, 503, 'NodeLink manager not initialized.');

    try {
      const body = (await readBodyJson(req).catch(() => ({}))) as Record<string, unknown>;

      switch (action) {
        case 'pause': {
          await manager.pause(guildId, true);
          break;
        }
        case 'resume': {
          await manager.pause(guildId, false);
          break;
        }
        case 'skip': {
          await manager.stop(guildId);
          break;
        }
        case 'stop': {
          await manager.stop(guildId);
          break;
        }
        case 'volume': {
          const level = Number(body['level']);
          if (!Number.isInteger(level) || level < 0 || level > 200) {
            return sendError(res, 400, 'Volume must be between 0 and 200.');
          }
          await manager.setVolume(guildId, level);
          break;
        }
        case 'seek': {
          const position = Number(body['position']);
          if (!Number.isFinite(position) || position < 0) {
            return sendError(res, 400, 'Position must be a non-negative number (ms).');
          }
          await manager.seek(guildId, position);
          break;
        }
        case 'loop': {
          const mode = String(body['mode'] ?? '');
          if (mode !== 'none' && mode !== 'track' && mode !== 'queue') {
            return sendError(res, 400, 'Loop mode must be none, track, or queue.');
          }
          await manager.setLoop(guildId, mode);
          break;
        }
        case 'shuffle': {
          await manager.setShuffle(guildId, true);
          break;
        }
        case 'unshuffle': {
          await manager.setShuffle(guildId, false);
          break;
        }
        case 'remove': {
          const position = Number(body['position']);
          if (!Number.isInteger(position) || position < 1) {
            return sendError(res, 400, 'Queue position must be a positive integer (1-indexed).');
          }
          const player = await manager.getPlayer(guildId);
          if (!player) return sendError(res, 404, 'No active player.');
          if (position > player.queue.length) {
            return sendError(res, 400, 'Queue position out of range.');
          }
          player.queue.splice(position - 1, 1);
          break;
        }
        case 'clear': {
          const player = await manager.getPlayer(guildId);
          if (player) player.queue = [];
          break;
        }
        case 'play': {
          const query = String(body['query'] ?? '').trim();
          if (!query) return sendError(res, 400, 'Query is required.');
          const player = await manager.getPlayer(guildId);
          if (!player) return sendError(res, 404, 'No active player.');
          const results = await manager.loadTracks(query);
          if (!results.data.length) return sendError(res, 400, 'No results found.');
          const track = results.data[0];
          if (!player.current) {
            await manager.play(guildId, track);
          } else {
            player.queue.push({ track, requester: String(body['requester'] ?? 'dashboard'), requestedAt: Date.now() });
          }
          break;
        }
        default:
          return sendError(res, 400, `Unknown action "${action}".`);
      }

      d.repo.logActivity(userId, 'info', 'music', `Music action "${action}" for guild "${guildId}".`);
      sendJson(res, 200, { ok: true });
    } catch (err) {
      sendError(res, 500, err instanceof Error ? err.message : 'Failed to run music action');
    }
  });
}
