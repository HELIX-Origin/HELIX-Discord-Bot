# Rule 07: Management Dashboard & Discord Integration Standards

**Status**: MANDATORY COMPLIANCE  
**Target Runtime**: Node.js `>=22.9`, TypeScript ESM, Discord API v10  
**Upstream Reference**: [discord.js Docs](https://discord.js.org/docs) | [Discord Developer Portal](https://discord.com/developers/docs)

---

## 1. Architectural Philosophy: Zero-Frontend-Dependency SSR

The HELIX management dashboard provides an integrated, web-based management console for configuring feeds, alert targets, and guild administrative settings. To preserve portability, low memory footprint, and zero operational maintenance overhead:

1. **Zero External Frontend Dependencies**:
   - The dashboard is built strictly with **vanilla TypeScript ESM** running on native Node.js `node:http`.
   - **No npm runtime frontend frameworks** (no React, Vue, Next.js, Angular, Svelte, or Webpack/Vite bundlers).
   - Server-Side Rendered (SSR) HTML templates return clean HTML strings with native CSS and minimal vanilla browser JavaScript.
2. **Discord OAuth2 Primary Authentication**:
   - Discord OAuth2 is the primary authentication provider using the `identify` and `guilds` scopes.
   - Sessions are managed via secure HTTP-only cookies (`sessionId`) persisted in SQLite (`oauth_sessions` / `users`).
   - Legacy Cloudflare OAuth and third-party OAuth platforms are retired.
3. **Guild-Centric Authorization**:
   - Access to guild configuration requires Discord **Administrator** (`0x8`) or **Manage Server** (`0x20`) permissions on the target guild.
   - Developer Tools and system-level operations (`/api/admin/*`) require application **Owner** or **Team Admin** status verified during OAuth2 exchange.
4. **Live Discord Bot Synchronization**:
   - The dashboard does not maintain duplicate Discord channel or guild state. It queries the live `DiscordBot` instance (`deps.bot`) for guild discovery, voice state, channel listings, and thread creation.
5. **Responsive Window-Fitting Layouts**:
   - Dashboard tab pages (e.g. Welcome, Tickets) MUST fit the browser viewport smoothly alongside `nav.sidebar` using responsive auto-fit grids (`repeat(auto-fit, minmax(360px, 1fr))`), pairing settings forms on the left with live preview cards on the right.
6. **Live Discord Previews & EmbedHandler Parity**:
   - Any embed preview, welcome message, or ticket prompt rendered in the dashboard UI MUST simulate Discord's layout with high fidelity (avatar, bot tag, timestamp, role/user mentions, blurple buttons, markdown parsing) and mirror `EmbedHandler` styling.
   - Live previews must update reactively on `input` and `change` events.

---

## 2. Directory Structure & Naming Standards (`src/dashboard/`)

```text
src/dashboard/
├── server.ts                       # HTTP server lifecycle, middleware pipeline, static asset routing
├── http/                           # HTTP transport utilities
│   ├── helpers.ts                  # sendJson, sendError, sendHtml, parseJsonBody, cookies
│   └── router.ts                   # URL pattern matching & parameter extraction
├── auth/                           # Local credential & session utilities
│   ├── password.ts                 # Scrypt password hashing
│   └── service.ts                  # Session tokens & credential checks
├── oauth/                          # Discord OAuth2 integration
│   ├── discord.ts                  # OAuth2 code exchange, user profile, and guilds fetch
│   ├── service.ts                  # OAuth state generation, token persistence, and role resolution
│   └── types.ts                    # Discord OAuth2 user and guild typings
├── routes/                         # Route controllers (grouped by domain)
│   ├── admin.ts                    # Developer tools & host-only system diagnostics (/api/admin/*)
│   ├── auth.ts                     # Login, logout, registration routes
│   ├── discord.ts                  # Discord channel discovery & bot status
│   ├── feeds.ts                    # Feed CRUD, preset enablement, and topic grouping
│   ├── guilds.ts                   # Guild management & permission verification
│   ├── oauth.ts                    # Discord OAuth2 login, callback, and error routes
│   ├── settings.ts                 # Server settings, feature toggles, and diagnostics
│   ├── shared.ts                   # requireAuth, requireOwner, and validation helpers
│   ├── stats.ts                    # System and feed metrics
│   └── webhooks.ts                 # Real-time WebSub/YouTube/Twitch webhook callbacks
├── views/                          # Server-side HTML template components
│   ├── admin.ts                    # Developer Tools UI pane
│   ├── dashboard.ts                # Main application dashboard layout orchestrator
│   ├── dashboard/                  # Modular dashboard view components (camelCase)
│   │   ├── styles.ts               # Theme-aware CSS stylesheet & responsive rules
│   │   ├── sidebar.ts              # Categorized sidebar navigation & guild switcher
│   │   ├── overview.ts             # Executive overview stats & activity viewer
│   │   ├── feeds.ts                # News catalog & custom RSS/Atom/Scrape forms
│   │   ├── sources.ts              # Reddit, Free Games, and Stream Alerts tab views
│   │   ├── welcome.ts              # Welcome announcement config & live Discord preview
│   │   ├── tickets.ts              # Support ticket channel routing & button preview
│   │   ├── logs.ts                 # Audit & moderation event logs view
│   │   ├── guildadmin.ts           # Roles, feature flags, and command prefix
│   │   ├── settings.ts             # System endpoints & team member viewer
│   │   └── clientScript.ts         # Modular client-side browser logic, tabs, & previews
│   ├── footer.ts                   # Standardized footer component
│   ├── guilds.ts                   # Guild selection & management panel
│   ├── landing.ts                  # Public landing page (when LANDING_PAGE_ENABLED=true)
│   ├── legal.ts                    # /privacy and /tos markdown-to-HTML legal views
│   ├── login.ts                    # Login & authentication forms
│   ├── oauth-callback.ts           # OAuth redirection & completion page
│   ├── theme.ts                    # Theme engine loader & CSS custom property injector
│   ├── themes/                     # Theme definitions (glassmorphism, dark, light, cyberpunk, etc.)
│   └── topbar.ts                   # Header navigation, guild switcher, and user avatar
└── webhooks/                       # Incoming push webhook router (WebSub & stream alerts)
    └── router.ts                   # Webhook topic resolution & deduplication
```

---

## 3. Environment-Only Theme Engine

1. **Configuration Exclusively via `.env`**:
   - `DASHBOARD_THEME`: Active theme (`glassmorphism`, `dark`, `light`, `cyberpunk`, `dracula`, `nord`, `emerald`). Each theme provides its own accent color palette.
   - `LANDING_PAGE_ENABLED`: Boolean controlling whether `/` serves the landing page or redirects to `/dashboard`.
2. **CSS Custom Properties**:
   - All styling MUST use theme CSS variables (`var(--bg-primary)`, `var(--bg-secondary)`, `var(--text-primary)`, `var(--accent)`, `var(--border-color)`). Never hardcode hex colors in view markup.
3. **Theme Engine**:
   - Themes and colors MUST live exclusively in the canonical theme files (`src/dashboard/views/themes/*.ts`). Views import theme CSS from `getThemeCss()` (`src/dashboard/views/theme.ts`); they never inline duplicate theme blocks. Adding a theme is a single new file in `src/dashboard/views/themes/`.

---

## 4. API & Route Controller Invariants

1. **Authentication Guards**:
   - Every protected route must invoke `requireAuth(req, res, deps)`.
   - Every system/host-only route must invoke `requireOwner(req, res, deps)`.
2. **JSON Response Standardization**:
   - Successful responses: `sendJson(res, 200, { ok: true, data: ... })` or descriptive object.
   - Error responses: `sendError(res, statusCode, message)`. Never leave HTTP requests hanging.
3. **Audit Logging**:
   - State-modifying operations (`POST`, `PATCH`, `DELETE`) must write an entry to the activity log via `deps.repo.logActivity(userId, level, category, message)`.
