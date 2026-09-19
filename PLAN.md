# HELIX Discord Bot — Current Session Plan

> 🏷️ **Tracking**: Session/roadmap planning companion to `TODO` (task checklist) and `BUGS` (bug & issue tracker). Roadmap issue: [#27](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/27).

---

## 🎯 Active Plan

### Goal — Guild Admin Sections, Dedicated Feature Tabs & Permission-Gated Dashboard

Split dashboard configuration into dedicated, permission-gated feature tabs (welcome, tickets, logs) while keeping Guild Admin for secure settings. Add a public Commands tab and a guilds page that lists every guild the user is in with invite/manage actions.

**Locked user directives** (do not re-litigate):

- Guild Admin tab is for specific configurations that benefit from being there; it is NOT a hiding place for features (m0584).
- Existing tabs stay as they are — they just need a check so only guild admins can access them. New features go in their own dedicated tabs with the same check. Guild Admin page is for displaying detailed info or secure settings that don't belong in the feature tabs (m0587).
- Users with Manage Channels permissions should have access to tabs that set things to channels (m0599).
- The guilds page should display all guilds the user is in, but only allow inviting the bot to guilds the user has permission to invite to. Buttons: invite icon + cog icon for managing (m0605).
- Guilds page uses pills: guild icon left, buttons right (m0609/m0612).
- Privacy and ToS pages visible to all users regardless of login (m0616).
- Commands page should not require login — it is read-only (m0617).
- Ticket system redesign: "the ticket system should open a new thread for the issues. but it should us a text channel for the message. Users simply click a button on the ticket channel message to open a ticket."
- Drop forum-channel feed delivery: "Let's also replace forum support with simply using threads instead. this way if threads are enabled the feeds simply post to threads in the configured text channel. The foums seem to be a bit wonky for our usage." (m0755). Resolved: a feed's dedicated thread is auto-created in the feed's own delivery `channel_id` (m0759) — the separate `forum_channel_id` target is removed.
- Feed thread role subscription + add notification: "make the threads public... also add a message to the channels that a feed is set up in to notify of a feed being added to the channel." (m0116). Resolved: feed threads are already public (type 12); feeds now carry an optional per-feed role (`role_id`) auto-subscribed to the feed's thread on creation/rotation (m0963 — per-feed role at add time), and adding a feed posts a short confirmation message into its target channel (dashboard + slash commands).

### Implementation Plan

> Status: steps 1-10 complete and committed (`627d783` dashboard, `cf6c6c3` ticket redesign, `21a4734` forum→thread refactor, `536e992` docs sync + THREADS_ENABLED gate — all pushed). Step 12 (feed role subscription + add notification) done in `779e4bb`; final docs/wiki/issue sync reruns now.

1. **Access relaxation**: allow any Discord user to log in; persist full guild list (`discord_guilds` setting) incl. `{id,name,icon,owner,permissions}`; relax `canUserAccessDashboard` to require only Discord auth (keep `canUserManageGuild` for per-guild admin). ✅
2. **Permission helpers**: reuse `hasManageChannelsPermission`; add `hasInvitePermission` (owner || ADMINISTRATOR || MANAGE_GUILD || CREATE_INSTANT_INVITE). ✅
3. **Guilds API**: `GET /api/guilds` merges stored user guilds + bot guilds → per-guild `{id,name,icon,botIn,canManage,canInvite,inviteUrl}`; `GET /api/guilds/:guildId/channels` adds `canManage`. ✅
4. **Public Commands page**: `GET /commands` (no auth) + public Commands tab data (registry metadata: name, category, description, usage, examples); `robots.txt` allows `/commands`. ✅
5. **Guilds view**: standalone `/guilds` page + in-dashboard guild-selection rewritten to pill grid (icon left, name middle, invite icon btn + cog btn right). ✅
6. **Sidebar**: add Commands tab (always visible); gate feed/alerts/admin sections behind `canManage`; add Welcome, Tickets, Logs dedicated tabs (manage-gated). ✅
7. **Secure Guild Admin tab**: keep admin role, feature modules, command toggles, prefix. Move Welcome / Tickets / Logs into their own tabs with per-tab partial save (PUT already partial-tolerant). ✅
8. **Client-side**: pill grid render, sidebar gating, `loadCommandsTab`, `loadWelcomeTab`/`loadTicketsTab`/`loadLogsTab` with per-tab save, relaxed 403 handling for non-managers. ✅
9. **Ticket redesign**: sticky button message in text channel → new thread per ticket; manager role auto-added; config key moves to `ticket_channel_id` (legacy `ticket_category_id` fallback read). ✅
10. **Forum→thread feed delivery**: remove the forum-channel feed target; thread-enabled feeds deliver into a dedicated thread auto-created in the feed's own `channel_id`; drop `forum_channel_id`/`forum_channel_ids`/`FORUM_CHANNEL_IDS` usage end-to-end (state types, repos, `FeedThreadManager`, targets, watcher, webhooks, bot, config, dashboard UI). ✅
11. **Role subscription + add notification**: feeds store an optional `role_id` (schema `role_id` column, migration tolerant); `FeedThreadManager` auto-subscribes the role to the feed thread on create/rotate (`addThreadRole`); `role` option on `/rss add`, `/reddit add`, `/youtube add`, `/twitch add`, `/free-games enable` + dashboard add/detail role selects; adding a feed posts `📡 **…** configured — updates will be posted here.` into the feed's target channel via `src/bot/lib/feeds/notify.ts`. ✅
12. **Verify + sync**: `npm run check` + `pnpm build`; commit + push; sync PLAN/TODO/BUGS, `wiki/`, and roadmap issue #27 items. ⏳
13. **Theme system magic-cleanup**: themes/colors must live only in the canonical theme files (`src/dashboard/views/themes/*.ts`); all dashboard pages import them via `getThemeCss()` from `theme.ts` — no inline duplicate theme blocks (contributors add a theme by dropping a single file in `src/dashboard/views/themes/`). Removed the separate color-scheme layer (`dashboardColorScheme`, `DASHBOARD_COLOR_SCHEME`, `scheme-*` overrides) since each theme provides its own accent palette. Deleted dead `src/dashboard/handlers/pages.ts`. ✅
14. **Dead code cleanup + vitest scan guard**: after the theme engine refactor, swept the whole codebase for exported symbols with zero external references using a new structural vitest test (`tests/unit/quality/dead-code.test.ts` — regex export extraction + identifier index over src+tests; exempts dynamically-loaded `src/bot/commands/**`, `_`-prefixed, and `default` exports). Removed 1000+ lines: deleted whole dead files (`bot/handlers/messages.ts`, `bot/utils/gateway.ts`, `bot/lib/feeds/format.ts`, `dashboard/config.ts`) plus orphaned symbols across bot/dashboard/db/feed/scheduler/state/util. `npm run check` + `pnpm build` both green. ✅

### Files likely touched

- `src/dashboard/routes/auth.ts`, `src/dashboard/routes/shared.ts`, `src/dashboard/routes/guilds.ts`
- `src/dashboard/oauth/discord.ts`
- `src/dashboard/server.ts`, `src/dashboard/views/guilds.ts`, `src/dashboard/views/dashboard.ts`
- `src/dashboard/views/dashboard/sidebar.ts`, `guildadmin.ts`, `client-script.ts`, new `welcome.ts`, `tickets.ts`, `logs.ts`, `commands.ts`
- `src/bot/rest.ts` (message components / thread start support)
- `src/bot/commands/admin/ticket.ts`, `welcome.ts`, `set.ts`
- `src/bot/lib/admin/auditlog.ts` (new), `src/bot/lib/admin/modlog.ts`
- `src/feed/threads.ts`, `targets.ts`, `watcher.ts`, `src/bot/bot.ts`, `src/feed/index.ts`, `src/config.ts`
- `src/state/types.ts`, `src/db/repository.ts`, `src/db/repositories/feeds.ts`, `src/db/repositories/users.ts`, `src/db/schema.ts`, `src/db/database.ts`
- `src/dashboard/webhooks/router.ts`, `src/dashboard/routes/guilds.ts`, `src/dashboard/views/dashboard/feeds.ts`, `client-script.ts` (thread-delivery toggle)
- `src/bot/lib/feeds/notify.ts` (new), `src/bot/commands/feeds/{rss,reddit,youtube,twitch,free-games}.ts`, `src/dashboard/routes/feeds.ts`, `src/feed/threads.ts`, `src/db/schema.ts`, `src/db/database.ts`, `src/db/repositories/feeds.ts`, `src/state/types.ts` (per-feed `role_id` subscription + channel-added notification)

---

## 🔖 Metadata

- **Project**: HELIX Discord Bot · **version** 0.5.0
- **Repos**: `HELIX-Discord-Bot`.