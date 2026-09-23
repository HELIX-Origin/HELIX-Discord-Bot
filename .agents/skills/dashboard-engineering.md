# Skill: Management Dashboard Engineering & Discord Integration

**Target Domain**: Self-Hosted HTTP Dashboard, Discord OAuth2, SSR Views, and Bot RPC  
**Primary Directory**: `src/dashboard/`

---

## 1. When to Use This Skill

Activate this skill when:
- Creating or modifying dashboard HTTP routes in `src/dashboard/routes/`.
- Building or modifying SSR HTML views in `src/dashboard/views/`.
- Implementing Discord OAuth2 authentication, permission verification, or session management.
- Integrating UI controls with live `DiscordBot` state (channel pickers, thread-delivery toggle, music queue control).
- Adding or styling theme components with CSS custom properties.

---

## 2. Key Architectural Patterns

### Standard Route Definition (`src/dashboard/routes/<domain>.ts`)
```ts
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppDeps } from '../../app.js';
import type { Router } from '../http/router.js';
import { sendJson, sendError, parseJsonBody } from '../http/helpers.js';
import { requireAuth } from './shared.js';

export function registerDomainRoutes(router: Router<AppDeps>): void {
  router.add('GET', '/api/domain/resource', async (req, res, _ctx, deps) => {
    const userId = await requireAuth(req, res, deps);
    if (userId === null) return;

    try {
      const data = deps.repo.getDomainData(userId);
      sendJson(res, 200, { ok: true, data });
    } catch (err) {
      sendError(res, 500, (err as Error).message);
    }
  });
}
```

### Discord Permission Validation for Guild Routes
```ts
import { hasPermission, ADMIN_PERMISSIONS } from '../../bot/lib/admin/permissions.js';

// Verify that user has Manage Guild (0x20) or Administrator (0x8) in the Discord Guild
const isAuthorized = userGuilds.some((g) => {
  if (g.id !== targetGuildId) return false;
  const permissions = BigInt(g.permissions);
  return (
    (permissions & BigInt(0x8)) !== 0n || // ADMINISTRATOR
    (permissions & BigInt(0x20)) !== 0n   // MANAGE_GUILD
  );
});

if (!isAuthorized) {
  sendError(res, 403, 'You lack administrator permissions for this server');
  return;
}
```

### Theme-Aware SSR View Component
All SSR view components must use semantic HTML and CSS custom properties:
```ts
export function renderComponent(title: string, content: string): string {
  return `
    <div class="card bg-secondary border-primary p-4 rounded-lg">
      <h3 class="text-accent text-lg font-bold mb-2">${title}</h3>
      <div class="text-primary text-sm">${content}</div>
    </div>
  `;
}
```

## 3. Responsive Window-Fitting Layouts & Simulated Discord Previews

1. **Responsive 2-Column Grid**:
   - Use CSS Grid with `repeat(auto-fit, minmax(360px, 1fr))` and `gap: 1.25rem` for management tab panes.
   - Pairs configuration form controls on the left with simulated Discord preview cards on the right.
   - Fits the window alongside `nav.sidebar` on desktop viewports and gracefully collapses into single columns on mobile.
2. **Discord Preview Component (`.discord-preview-container`)**:
   - Render Discord elements: avatar (`.discord-avatar`), bot username tag and badge (`.discord-bot-badge`), timestamp, mention pills (`.discord-mention`), and interactive buttons (`.discord-btn-primary`).
   - Dynamically bind `input` and `change` event listeners in `clientScript.ts` to refresh previews in real-time as users edit templates.

---

## 4. Mandatory Guardrails

1. **No External Frontend Bundles**: Never introduce npm packages for frontend UI frameworks or bundlers.
2. **Never Return Raw Unhandled Exceptions**: All route handlers must use try/catch blocks and respond with `sendError(res, 500, ...)`.
3. **Always Log State-Changing Actions**: Use `deps.repo.logActivity(...)` on all create/update/delete operations.
4. **Clean DOM Tab Isolation**: When switching tabs, clean up or hide all sibling panes (`#dashboard-view main > .tab-pane, #dashboard-view .tab-pane, #feed-detail-view`) to prevent content bleed between views.
