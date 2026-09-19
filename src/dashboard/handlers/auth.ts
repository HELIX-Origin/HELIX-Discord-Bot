import type { ServerResponse } from 'node:http';
import type { AppDeps } from '../../app.js';
import { sendError } from '../http/helpers.js';

interface DashboardContext {
  deps: AppDeps;
  userId: number | null;
}

function requireAuth(ctx: DashboardContext, res: ServerResponse): number | null {
  if (ctx.userId === null) {
    sendError(res, 401, 'Authentication required');
    return null;
  }
  return ctx.userId;
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

export function errorResponse(res: ServerResponse, message: string, status = 500): void {
  sendError(res, status, message);
}
