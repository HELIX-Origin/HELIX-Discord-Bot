import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppDeps } from '../../app.js';
import { sendError, sendJson } from '../http/helpers.js';

export interface DashboardContext {
  deps: AppDeps;
  userId: number | null;
}

export async function getDashboardContext(req: IncomingMessage, deps: AppDeps): Promise<DashboardContext> {
  const userId = await getAuthedUserId(req, deps);
  return { deps, userId };
}

export async function getAuthedUserId(req: IncomingMessage, deps: AppDeps): Promise<number | null> {
  const sessionToken = getSessionToken(req);
  if (sessionToken) {
    const user = deps.repo.getUserBySessionToken(sessionToken);
    if (user) return user.id;
  }
  return null;
}

function getSessionToken(req: IncomingMessage): string | null {
  const cookie = req.headers['cookie'];
  if (!cookie) return null;
  const cookies = cookie.split(';').reduce(
    (acc, c) => {
      const [key, value] = c.trim().split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );
  return cookies['helix_session'] ?? null;
}

export function requireAuth(ctx: DashboardContext, res: ServerResponse): number | null {
  if (ctx.userId === null) {
    sendError(res, 401, 'Authentication required');
    return null;
  }
  return ctx.userId;
}

export function requireDashboardAccess(ctx: DashboardContext, res: ServerResponse): number | null {
  const userId = requireAuth(ctx, res);
  if (userId === null) return null;
  return userId;
}

export function requireOwner(ctx: DashboardContext, res: ServerResponse): number | null {
  const userId = requireAuth(ctx, res);
  if (userId === null) return null;
  const user = ctx.deps.repo.getUserById(userId);
  if (!user || user.role !== 'owner') {
    sendError(res, 403, 'Owner access required');
    return null;
  }
  return userId;
}

export function jsonResponse<T>(res: ServerResponse, data: T, status = 200): void {
  sendJson(res, status, data);
}

export function errorResponse(res: ServerResponse, message: string, status = 500): void {
  sendError(res, status, message);
}
