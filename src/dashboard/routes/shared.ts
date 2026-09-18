import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppDeps } from '../../app.js';
import { COOKIE_NAME, getRequestBaseUrl, parseCookies, sendError } from '../http/helpers.js';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 3600;

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isLocalhostRequest(req: IncomingMessage): boolean {
  const ip = req.socket?.remoteAddress;
  if (!ip) return false;
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.startsWith('127.');
}

export function getSessionToken(req: IncomingMessage): string {
  return parseCookies(req)[COOKIE_NAME] ?? '';
}

export async function authedUserId(req: IncomingMessage, deps: AppDeps): Promise<number | null> {
  const token = getSessionToken(req);
  if (token) {
    const user = deps.repo.getUserBySessionToken(token);
    if (user) return user.id;
  }
  return null;
}

export function isOwnerUser(userId: number | null, deps?: AppDeps): boolean {
  if (userId === null) return false;
  if (deps) {
    const user = deps.repo.getUserById(userId);
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (deps.bot) {
      const conns = deps.oauth.connectionsFor(userId);
      const discordConn = conns.find((c) => c.provider === 'discord');
      if (discordConn && deps.bot.isOwnerDiscordId(discordConn.providerAccountId)) {
        return true;
      }
    }
  }
  return false;
}

export const isHostUser = isOwnerUser;

export function isAdminOrOwner(userId: number | null, deps: AppDeps): boolean {
  if (userId === null) return false;
  const user = deps.repo.getUserById(userId);
  if (!user) return false;
  if (user.role === 'owner' || user.role === 'admin') return true;
  if (deps.bot) {
    const conns = deps.oauth.connectionsFor(userId);
    const discordConn = conns.find((c) => c.provider === 'discord');
    if (discordConn && deps.bot.isOwnerOrAdminDiscordId(discordConn.providerAccountId)) {
      return true;
    }
  }
  return false;
}

export function getUserManagedGuildIds(userId: number, deps: AppDeps): string[] | null {
  if (isAdminOrOwner(userId, deps)) return null;
  const raw = deps.repo.getUserSetting(userId, 'managed_guild_ids');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface StoredUserGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

/** Full Discord guild list captured at login (id, name, icon, owner, permissions). */
export function getUserGuilds(userId: number, deps: AppDeps): StoredUserGuild[] {
  const raw = deps.repo.getUserSetting(userId, 'discord_guilds');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUserGuild[]) : [];
  } catch {
    return [];
  }
}

export function canUserAccessDashboard(userId: number | null, deps: AppDeps): boolean {
  if (userId === null) return false;
  if (isAdminOrOwner(userId, deps)) return true;
  // Any Discord-connected user can access the dashboard (Commands tab visible to all;
  // guild-managing tabs are gated per-guild by canUserManageGuild).
  return deps.oauth.connectionsFor(userId).some((c) => c.provider === 'discord');
}

export function canUserManageGuild(userId: number, guildId: string, deps: AppDeps): boolean {
  if (isAdminOrOwner(userId, deps)) return true;
  const managed = getUserManagedGuildIds(userId, deps);
  return managed !== null && managed.includes(guildId);
}

export async function requireDashboardUser(
  req: IncomingMessage,
  res: ServerResponse,
  deps: AppDeps,
): Promise<number | null> {
  const userId = await authedUserId(req, deps);
  if (userId === null) {
    sendError(res, 401, 'Authentication required');
    return null;
  }
  if (!canUserAccessDashboard(userId, deps)) {
    sendError(res, 403, 'Forbidden: Access restricted to Discord-connected users.');
    return null;
  }
  return userId;
}

export async function requireUser(req: IncomingMessage, res: ServerResponse, deps: AppDeps): Promise<number | null> {
  const userId = await authedUserId(req, deps);
  if (userId === null) sendError(res, 401, 'Authentication required');
  return userId;
}

export async function requireAdminOrOwner(
  req: IncomingMessage,
  res: ServerResponse,
  deps: AppDeps,
): Promise<number | null> {
  const userId = await authedUserId(req, deps);
  if (userId === null) {
    sendError(res, 401, 'Authentication required');
    return null;
  }
  if (!isAdminOrOwner(userId, deps)) {
    sendError(res, 403, 'Forbidden: Administrator or Owner access required');
    return null;
  }
  return userId;
}

export async function requireOwner(req: IncomingMessage, res: ServerResponse, deps: AppDeps): Promise<number | null> {
  const userId = await authedUserId(req, deps);
  if (userId === null) {
    sendError(res, 401, 'Authentication required');
    return null;
  }
  if (!isOwnerUser(userId, deps)) {
    sendError(res, 403, 'Forbidden: Owner access required');
    return null;
  }
  return userId;
}

export const requireHost = requireAdminOrOwner;

export function getDiscordCallbackUri(deps: AppDeps, _req?: IncomingMessage): string {
  if (process.env['DISCORD_CALLBACK_URL']?.trim()) {
    return process.env['DISCORD_CALLBACK_URL']!.trim();
  }
  if (deps.config.callbackUrl) {
    return deps.config.callbackUrl;
  }
  return `${deps.config.publicBaseUrl ?? `${deps.config.internalUrl}`}/api/auth/callback/discord`;
}

export function redirectUriForProvider(deps: AppDeps, provider: string, req?: IncomingMessage): string {
  if (provider === 'discord') {
    return getDiscordCallbackUri(deps, req);
  }
  const base =
    deps.config.publicBaseUrl ??
    (req ? getRequestBaseUrl(req, deps.config.publicBaseUrl, deps.config.internalUrl) : deps.config.internalUrl);
  return `${base.replace(/\/+$/, '')}/api/oauth/${encodeURIComponent(provider)}/callback`;
}
