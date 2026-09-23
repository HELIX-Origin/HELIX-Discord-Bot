# HELIX Discord Bot — Task Checklist & Session Tracking

**Verification gate for every workstream:** `npm run check` + `pnpm build` must both pass before a workstream is considered done.

---

## 🔥 Active Tasks

### Workstream: Real-Time Single-Newest-Post Feed Delivery & Rate-Limit Shield

**Locked user directives:**

- "All feeds should not be limited by poll intervals. Instead they should pick up new posts as they arrive and post them."
- "We should make sure they post the single newest post as it comes in. That way they are always up to date and aren't posting 10 to 20 posts at a time."
- "this is the correct way to handle the rate limiting problem while still ensuring they don't miss information."
- Use camelCase file naming scheme across the codebase.

**Implementation checklist:**

- [x] `src/feed/watcher.ts`: Eliminate `RSS_POST_INTERVAL_FLOOR_MS` (6 hours) and once-per-UTC-day throttle
- [x] `src/feed/watcher.ts`: For RSS/scrape/Reddit feeds, select and post only the single newest unposted entry
- [x] `src/feed/watcher.ts`: Drain backlog: mark older unposted entries in the current cycle as sent (`repo.markEntrySent` / `redis.markEntrySent`) and advance cursor
- [x] `src/feed/watcher.ts`: Align Free Games delivery to single newest entry per cycle instead of looping over all unposted games
- [x] `src/feed/watcher.ts`: Align Stream Alerts (YouTube / Twitch fallback) to single newest entry per cycle instead of looping
- [x] `src/feed/watcher.ts`: Add inter-feed pacing in `pollAllFeeds` / `pollGuildFeeds` to avoid bursting Discord API
- [x] `src/config.ts`: Update default `pollIntervalMs` to 1 minute (`60_000`) and support `POLL_INTERVAL_MS` env var
- [x] `src/dashboard/webhooks/router.ts`: Verify single-entry delivery parity across WebSub / PubSubHubbub / EventSub
- [x] `tests/unit/feed/watcher.test.ts`: Create test suite verifying single-newest-post delivery, backlog drain, and zero artificial time gating
- [x] `npm run check` + `pnpm build` green

### Workstream: Guild Admin Sections, Dedicated Feature Tabs & Permission-Gated Dashboard

**Locked user directives:**

- Guild Admin tab stays for specific/secure configurations; it is not a hiding place for features.
- Existing tabs stay as they are but get a guild-admin access check. New features get their own dedicated tabs with the same check.
- Users with Manage Channels permissions should have access to tabs that set things to channels.
- Guilds page shows all guilds the user is in; invite allowed only with invite permission. Buttons: invite icon + cog icon.
- Guilds page uses pill layout: guild icon left, buttons right.
- Privacy / ToS pages visible without login.
- Commands page requires no login (read-only).
- Ticket system: text channel hosts a button; clicking opens a new thread.
- Replace forum feed delivery with threads: "if threads are enabled the feeds simply post to threads in the configured text channel. The forums seem to be a bit wonky for our usage." (m0755). Dedicated thread is auto-created in the feed's own delivery `channel_id` (m0759); the separate forum target is removed.
- Feed threads public + role subscription + add notification: "make the threads public... also add a message to the channels that a feed is set up in to notify of a feed being added to the channel." (m0116). Feed threads are already public (type 12); each feed gets an optional role auto-subscribed to its thread (per-feed role at add time, m0963) and a confirmation message is posted into the feed's channel on add.

**Implementation checklist:**

- [x] Relax Discord login (`auth.ts`): allow any Discord user; persist `discord_guilds` (full list w/ permissions)
- [x] Relax `canUserAccessDashboard` (`shared.ts`) to require only Discord auth; keep `canUserManageGuild`
- [x] `oauth/discord.ts`: add `hasInvitePermission` helper
- [x] Rewrite `GET /api/guilds`: merge user guilds + bot guilds → `{id,name,icon,botIn,canManage,canInvite,inviteUrl}`
- [x] Add `canManage` to `GET /api/guilds/:guildId/channels` response
- [x] Public `GET /commands` page (no auth) from registry metadata; `robots.txt` allow
- [x] Rewrite `/guilds` view + in-dashboard guild-selection to pill grid (invite btn + cog btn)
- [x] `sidebar.ts`: always-visible Commands tab; gate feed/admin sections by `canManage`; add Welcome/Tickets/Logs tabs
- [x] Split `guildadmin.ts`: keep Roles/Features/Commands/Prefix; new `welcome.ts`/`tickets.ts`/`logs.ts` tabs with per-tab save
- [x] `clientScript.ts`: pill grid, sidebar gating, `loadCommandsTab`, per-tab load/save, relaxed 403 handling
- [x] `dashboard.ts`: render new tab panes; pass `canManage` to sidebar
- [x] Ticket redesign: sticky text-channel button message → thread per ticket, manager role auto-added (`ticket_channel_id` key)
- [x] `npm run check` + `pnpm build` green
- [x] Commit + push; sync `PLAN`/`TODO`/`BUGS`, `wiki/`, roadmap issue #27 per Rule 04/05
- [x] Forum→thread feed delivery: remove forum target end-to-end; thread-enabled feeds post to a dedicated thread in their own `channel_id` (state types, repos, `FeedThreadManager`, targets, watcher, webhooks, bot, config, dashboard UI)
- [x] Feed role subscription: per-feed `roleId` stored (`role_id` column + migration); `role` option on all feed-add slash commands + dashboard add/detail role selects; ThreadSender subscribes the role to the feed thread on create/rotate (`addThreadRole`)
- [x] Feed-add channel notification: `notifyFeedAdded` (`src/bot/lib/feeds/notify.ts`) posts a confirmation into the feed's target channel on slash-command adds and dashboard POST /api/feeds
- [x] `npm run check` + `pnpm build` green (779e4bb)

### Workstream: Dashboard UI Window-Fitting, Live Discord Previews & Reddit Filter

**Locked user directives:**
- Filter out Reddit community home posts: "The community home post should always be ignored in reddit feeds since it is a persistent static post that could cause reddit feeds to miss actual new posts."
- Fix tab content carryover: "there is also a slight issue with switching between tabs. the previous tab's content is being carried over when changing tabs."
- Window fitting & live preview: "also the content of the tickets page and welcome page need to be properly fitted to the window. just like the other pages were."
- Prefer options over subcommands with modular option files (`src/bot/lib/options/<command>.ts`).
- Preserve camelCase file naming scheme across the codebase.

**Implementation checklist:**
- [x] `src/feed/reddit.ts`: Filter out static community home posts from subreddit syndication
- [x] `src/dashboard/views/dashboard/clientScript.ts`: Fix tab switching carryover by strictly selecting and hiding all `.tab-pane` and `#feed-detail-view` elements
- [x] `src/dashboard/views/dashboard/styles.ts`: Add responsive styles and Discord preview components (`.discord-preview-container`, `.discord-btn-primary`, `.discord-mention`, etc.)
- [x] `src/dashboard/views/dashboard/welcome.ts`: 2-column responsive layout with Welcome Configuration card and Live Discord Preview card
- [x] `src/dashboard/views/dashboard/tickets.ts`: 2-column responsive layout with Routing card and Live Button Preview card
- [x] `src/dashboard/views/dashboard/clientScript.ts`: Add `updateWelcomePreview()` and `updateTicketPreview()` with live markdown and placeholder parsing
- [x] `tests/unit/dashboard/views.test.ts`: Add unit tests for live preview containers and client hooks
- [x] `npm run check` + `pnpm build` green
- [x] Repository documentation sync (README, wiki/*, .agents/*, IMPORTANT.md)

**Status:** dashboard phase (`627d783`), ticket redesign (`cf6c6c3`), forum→thread refactor (`21a4734`), docs sync + THREADS_ENABLED gate (`536e992`), and role-subscription + add-notification (`779e4bb`) committed + pushed — each ran green `npm run check` + `pnpm build`. Remaining: final docs/wiki/issue sync (roadmap issue #27 Phase 9/10 checkboxes + new Phase 11 role/notification row). Progress mirrored on roadmap issue #27.

### Workstream: Theme System — Single Source of Truth (`themes/*.ts`)

**Locked user directives:**

- "all themes and colors should be handled by the theme files... the dashboard pages and elements need to import their styles from the actual theme files. this is a mandatory feature to allow contributors to easily create new themes and colors for the dashboard." (m1083)
- "since we have custom themes, separate color schemes might be a bit overkill. the themes can just provide their own unique color schemes." (m1131)

**Implementation checklist:**

- [x] Dashboard `styles.ts` → `${getThemeCss()}` + component CSS (import from `theme.ts`); no inline theme var blocks
- [x] login / landing / commands / legal / guilds / admin / oauth-callback pages import `getThemeCss()` and drop inline theme blocks; html classes now use real `theme.id`
- [x] Delete dead `src/dashboard/handlers/pages.ts` (unused local theme duplicates)
- [x] Remove color-scheme layer: `AppConfig.dashboardColorScheme`, `DashboardRuntimeConfig.colorScheme`, `DASHBOARD_COLOR_SCHEMES`/`DashboardColorScheme`, `colorSchemeOverrides` (shared.ts), `ColorSchemeInfo`/`getColorSchemeInfo` (theme.ts), `scheme-*` html classes, settings-tab scheme fields, `DASHBOARD_COLOR_SCHEME` env var (kept `colorSchemeMode` native `color-scheme` for scrollbars/inputs)
- [x] Docs: `.env.example`, `wiki/Configuration`, `wiki/Architecture-and-Design`, `.agents/rules/dashboard-standards`, `.agents/agents/engineering/sub-agents/dashboard-engineer`
- [x] `npm run check` + `pnpm build` green

### Workstream: Dead Code Cleanup + Vitest Scan Guard

**Locked user directives:**

- "ok commit and push. then check for any dead code left behind." (m1180)
- "hold. up let's update out vitests suite to be able to handle scanning for dead code" (m0351) — the vitest suite gained a structural scan that fails on exported symbols with no external references.

**Implementation checklist:**

- [x] New `tests/unit/quality/dead-code.test.ts`: regex export extraction + identifier index over `src/` + `tests/`; fails with `path:name` list for exports referenced in zero other files; exempts dynamically-loaded `src/bot/commands/**`, `_`-prefixed identifiers, `default` exports; regression test ensures live `defaultConfig` stays flagged as consumed
- [x] `bot/**`: deleted `messages.ts`, `gateway.ts`, `lib/feeds/format.ts` (whole files); deleted dead helpers in `config.ts`, `handlers/commands.ts`, `handlers/registry.ts`, `utils/embeds.ts`, `utils/types.ts`; stripped `export` from internal-only typing across `bot.ts`, `rest.ts`, `lib/admin/*`, `lib/feeds/notify.ts`
- [x] `dashboard/**`: deleted dead `dashboard/config.ts`, `configuredOAuthError`, `isHostUser`/`requireHost` aliases, `subscribeFeedToWebhook`, `getBaseStyles` (themes/shared.ts `baseStyles` CSS block), `createDiscordRssServer` alias, dead helper middlewares/views; stripped internal-only `export` throughout auth/http/oauth/routes/views
- [x] `db/**`, `feed/**`, `scheduler/**`, `state/**`, `util/**`: stripped internal-only exports (e.g. `DbStats`, `FetchError`, `FeedPreset`, `RedisCoordinatorImpl`, `LogContext`); deleted unreferenced symbols (`childTextList`, `discoverFeedLinks`, `presetsGroupedByCategory`, `feedTopic`)
- [x] Cleaned now-unused imports/types fallout (`ApplicationCommand`, `IncomingMessage`, orphaned `GatewayOpcode` const+type)
- [x] `npx vitest run tests/unit/quality/dead-code.test.ts` → PASS (2 tests)
- [x] `npm run check` + `pnpm build` green (52 files, +82/−1013)

### Workstream: Stream Alerts Audit, Zero-Config YouTube Ingestion & Rich Twitch Metadata

**Locked user directives:**
- "ok we need to audit our stream alert support. I don't know if they work or not, but we should check just in case."
- Ensure reliable out-of-the-box operation for YouTube video uploads/streams and Twitch live alerts.
- Use camelCase file naming scheme across the codebase.

**Implementation checklist:**
- [x] Audit stream alert ingestion, polling, and embed formatting across `src/feed/watcher.ts`, `src/bot/utils/embeds.ts`, `src/bot/commands/feeds/youtube.ts`, and `src/bot/commands/feeds/twitch.ts`
- [x] Create `src/feed/youtube.ts`: zero-config public Atom XML parsing (`channel_id=UC...`), smart channel ID resolution (`@handle`, `/channel/UC...`, bare IDs), and high-resolution thumbnail generation
- [x] `src/feed/watcher.ts`: Ingest YouTube feeds via public Atom feeds with zero API keys required; preserve optional YouTube Data API v3 fallback with corrected regex
- [x] `src/feed/watcher.ts`: Extract Twitch stream metadata (`game_name`, `viewer_count`, thumbnail URL, user login sanitization)
- [x] `src/bot/utils/embeds.ts`: Update `streamAlertEmbed` with dynamic `🎮 Category` and `👥 Viewers` for Twitch, and `▶️ Type` for YouTube
- [x] `src/feed/parser.ts`: Support nested `<media:group>` tags in `findEntryImage` and fallback `<media:description>` in `parseAtom`
- [x] `tests/unit/feed/streamAlerts.test.ts`: 10 comprehensive unit tests covering YouTube channel ID/XML resolution, Atom parsing, Twitch live stream extraction, and rich embed formatting
- [x] `npm run check` + `npm run build` green (22/22 test files, 348/348 tests passing)
- [x] Repository documentation sync (`README.md`, `wiki/Feeds-and-Scrapers.md`, `wiki/Configuration.md`, `.env.example`, `TODO.md`)

### Workstream: Optional Embed Support for Ticket Message Setup

**Locked user directives:**
- "ok let's add optional embed support to the ticket message setup"
- Ensure parity with `/welcome` embed options across slash commands, web dashboard, and live Discord preview.
- Use camelCase file naming scheme across the codebase.

**Implementation checklist:**
- [x] `src/bot/lib/options/ticket.ts`: Add `embed` (boolean) and `color` (hex string) options to `/ticket` setup command
- [x] `src/bot/commands/admin/ticket.ts`: Update `TicketConfig` and `getTicketConfig` with `embed` and `color` settings
- [x] `src/bot/commands/admin/ticket.ts`: Update `sendTicketButtonMessage` to support optional embed payloads hosting the `Open Ticket` button
- [x] `src/bot/commands/admin/ticket.ts`: Update `handleSetup` and `handleView` to store, dispatch, and display embed format
- [x] `src/dashboard/views/dashboard/tickets.ts`: Add Format selector (`Plain text` / `Embed`) to the Ticket Routing & Message card
- [x] `src/dashboard/routes/guilds.ts`: Handle `embed` and `color` in `body.tickets` on `PUT /api/guilds/:guildId/settings`
- [x] `src/dashboard/views/dashboard/clientScript.ts`: Populate, save, and dynamically render simulated Discord embed card in `updateTicketPreview()`
- [x] `tests/unit/commands/ticket.test.ts` & `tests/unit/dashboard/views.test.ts`: Add unit tests for ticket embed setup and preview elements
- [x] `wiki/*`: Document embed options in `Administration.md`, `Discord-Bot.md`, and `API-Reference.md`
- [x] `npm run check` + `npm run build` green (22/22 test files, 350/350 tests passing)

---

## 🛠️ Verification Commands

```
npm run check               # typecheck + format:check + lint + tests (must pass)
pnpm build                  # tsc compile to dist/ (must pass)
npm test                    # vitest run
npx prettier --write src    # only when format:check complains
```

---

## 🔖 Metadata

- **Project**: HELIX Discord Bot · **version** 0.6.0
- **Agent Ecosystem:** `AGENTS` and `.agents/` are tracked directly in repository git tracking.