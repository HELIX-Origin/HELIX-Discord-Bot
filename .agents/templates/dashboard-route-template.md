# Dashboard Route Handler Template

Standard Dashboard Domain Route Handler Template.
Follows Rule 07: Management Dashboard Standards.

```typescript
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppDeps } from '../../src/app.js';
import type { Router } from '../../src/dashboard/http/router.js';
import { sendJson, sendError, parseJsonBody } from '../../src/dashboard/http/helpers.js';
import { requireAuth, requireOwner } from '../../src/dashboard/routes/shared.js';

export function registerExampleRoutes(router: Router<AppDeps>): void {
  // GET endpoint with authentication
  router.add('GET', '/api/example', async (req: IncomingMessage, res: ServerResponse, _ctx, deps: AppDeps) => {
    const userId = await requireAuth(req, res, deps);
    if (userId === null) return;

    try {
      sendJson(res, 200, { ok: true, data: [] });
    } catch (err) {
      sendError(res, 500, (err as Error).message);
    }
  });

  // POST endpoint with body parsing and audit logging
  router.add('POST', '/api/example', async (req: IncomingMessage, res: ServerResponse, _ctx, deps: AppDeps) => {
    const userId = await requireAuth(req, res, deps);
    if (userId === null) return;

    try {
      const body = await parseJsonBody<{ name: string }>(req);
      if (!body.name || !body.name.trim()) {
        sendError(res, 400, 'Name parameter is required');
        return;
      }

      deps.repo.logActivity(userId, 'info', 'dashboard', `Created example resource "${body.name}"`);
      sendJson(res, 201, { ok: true, name: body.name });
    } catch (err) {
      sendError(res, 500, (err as Error).message);
    }
  });
}
```
