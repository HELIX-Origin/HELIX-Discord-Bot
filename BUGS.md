# BUGS.md — Bug & Issue Tracker

> This file is the **bug & issue tracker** for HELIX Discord Bot. It holds the
> migrated issue history (formerly the "Current Issues" section of `AGENTS.md`), tracks
> open/resolved bugs during development, and complements `PLAN.md` (roadmap) and `TODO.md`
> (task checklist). Remote, user-facing work is tracked as GitHub issues/roadmaps per
> Rule 04 (remote-issue-protocol.md).

## Status Legend

| Status | Meaning |
|---|---|
| 🟥 Open | Actively being worked on |
| 🟨 Investigating | Problem reproduced, root cause pending |
| 🟩 Resolved | Fixed and verified |
| ♻️ Retired / Superseded | Feature or fix later removed, replaced, or revised |

---

## Open / In Progress

*None currently.*

Remote roadmap work continues on GitHub (issues #19–#25 and successors) per Rule 04.

---

## Resolved / Retired History

### 1. Cloudflare OAuth Failure & Retirement 🟩 Resolved / ♻️ Retired
- **Problem**: Cloudflare OAuth login failed with `Page not found: The route /oauth/error does not exist`. Furthermore, Cloudflare OAuth requires custom domains and public SSL certificates which cannot be sustained under self-hosted zero-cost requirements.
- **Resolution**:
  - Cloudflare OAuth provider and dependencies were retired entirely from the codebase.
  - Dedicated `/oauth/error` and `/api/oauth/error` routes were implemented in `src/dashboard/routes/oauth.ts` and `src/dashboard/http/oauth-callback.ts` to ensure clean error recovery.
  - Discord OAuth remains the primary authentication and authorization provider.
  - The obsolete `Integrations` tab was removed from the dashboard navigation.
  - In-dashboard OAuth credential configuration was removed from Settings to avoid out-of-sync credential state; configuration is exclusively handled through `.env`.

### 2. Legacy Webhook Terminology in Dashboard UI 🟩 Resolved
- **Problem**: Earlier iterations of the dashboard referenced "Webhooks" and "Missing Webhooks", whereas the service now posts directly to Discord channels via the bot.
- **Resolution**: UI labels, modal subtitles, diagnostic metrics, and status badges were updated to reflect direct Discord Channel delivery.

### 3. Theme Support 🟩 Resolved (superseded by #6 env theme engine)
- **Problem**: The dashboard was dark-mode only without theme customization.
- **Resolution**: Fully responsive Light and Dark themes were implemented with auto-detection via `prefers-color-scheme`, local storage persistence, and an interactive toggle in the header.
- **Note**: Later superseded/enhanced by the env-only theme engine in issue #6 (`DASHBOARD_THEME`, `DASHBOARD_COLOR_SCHEME`, `LANDING_PAGE_ENABLED`, per Rule 00 `.env` only).

### 4. Site Status Monitors Retirement 🟩 Resolved / ♻️ Retired
- **Problem**: Site status monitors added unnecessary complexity and maintenance overhead without Cloudflare support.
- **Resolution**: Decommissioned and removed status monitoring across backend services, SQLite persistence, dashboard UI, and bot commands (`/monitor`). Service is streamlined to focus on RSS/Atom/Reddit/Free-Games feed syndication.
- **Note**: The original resolution text said "exclusively RSS/Atom/Scrape"; the product later expanded to Reddit/Free Games/Stream Alerts.

### 5. One-Click Cloud Deploy Retirement & Manual PaaS Policy 🟩 Resolved
- **Problem**: One-click cloud deploy buttons (Heroku, Render, Railway templates) added maintenance overhead, fragile out-of-sync credentials, and payment barriers.
- **Resolution**:
  - One-click deploy buttons, `app.json`, and Heroku `Procfile` were retired.
  - Manual container-based PaaS hosting (Railway, Render, Fly.io) is supported when users configure their own persistent storage volumes for SQLite (`/app/data`) and manage credentials in their provider dashboard.
  - Port binding supports `PORT` / `INTERNAL_URL` / `DISCORD_PORT` (default 3131).
  - Deployment documentation in `wiki/Deployment-and-Hosting.md` details Docker, VPS/systemd, Local Windows, and manual PaaS (Railway, Render, Fly.io).

### 6. News Feeds Tab Regression & Dashboard Env Theme Engine 🟩 Resolved
- **Problem**: Renaming the "Popular Feeds" tab to "News Feeds" left a lingering `loadPopularTab()` call in `src/dashboard/views/dashboard.ts`, throwing `loadPopularTab is not defined` after enabling a catalog feed. Dashboard looked fixed/dark-only with no configurable appearance.
- **Resolution**:
  - Replaced `loadPopularTab()` with `loadNewsTab()` and removed the stale `'popular'` tab alias (`tabId === 'news'`).
  - Added an **env-only theme engine**: `DASHBOARD_THEME` (glassmorphism, dark, light, cyberpunk, dracula, nord, emerald), `DASHBOARD_COLOR_SCHEME` (11 accent schemes), and `LANDING_PAGE_ENABLED` — configured exclusively via `.env` per Rule 00.
  - Added theme-aware landing page with `/`, `/home`, `/landing` routes; `/` redirects to `/dashboard` when `LANDING_PAGE_ENABLED=false`.
  - Documented new variables in `.env.example`; tracked via `PLAN.md` and [#19](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/19).

### 7. Developer Tools Tab Restored with Owner/Team-Only Logs Page 🟩 Resolved
- **Problem**: The host-only Dev Tools page (introduced in `3e9a4d1`) was removed during the large dashboard rewrite; the `activity_log` table and `/api/admin/*` endpoints existed but had no dashboard UI.
- **Resolution**:
  - Restored a **Developer Tools** sidebar tab, rendered only for the Discord bot owner/team (`isOwnerUser` → role `owner`, set for application owner + team members during OAuth).
  - Added a runtime diagnostics grid (`/api/admin/stats`): feeds, entries delivered, users, DB size, uptime, memory RSS/heap, Node version, platform.
  - Added a **Service Logs** page (`/api/admin/activity`) with level filtering (all/info/warn/error/debug) and adjustable limits.
  - Added Developer Actions: "Poll All Feeds Now", "Sync Discord Slash Commands", "Optimize SQLite DB" — every action written to the activity log.
  - Hardened all `/api/admin/*` routes to `requireOwner` (owner/team only at the API layer as well).

### 8. Dashboard Operational Fixes & Derived App Name 🟩 Resolved
- **Problem**: The Overview "Discord Delivery" stat stayed at `0`, `/privacy` & `/tos` rendered links/formatting as raw markdown, and the app name was hardcoded instead of using the Discord bot application name.
- **Resolution**:
  - `loadOverviewTab()` now calls `loadDiscordChannels()` so the delivered-channels stat reflects the real bot channel state.
  - Rewrote `markdownToHtml` in `src/dashboard/views/legal.ts` as a line-based renderer (headings, bold/italic/code, `[text](url)` links, lists, `---` rules) for `/privacy` and `/tos`.
  - App name now derives from the Discord application (`DiscordBot.getAppName()` via `appDisplayName(deps)` in `src/app.ts`) across bot embeds (`/about`, `/stats`, `/help`, `/feed`), dashboard views, auth/error pages, and OAuth views.

### 9. Discord Threads as Feed Delivery Targets 🟩 Resolved (per [#20](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/20))
- **Problem**: Feeds could only deliver into text/announcement channels; Discord Threads were filtered out of channel discovery in `src/bot/rest.ts` and unsupported as delivery targets.
- **Resolution**:
  - Optional, per-guild forum/thread delivery. Each feed in a thread-enabled guild delivers into its own dedicated thread inside a forum channel (one thread per feed; first entry is the opening post).
  - `FeedThreadManager` in `src/feed/threads.ts`: forum channel selection (per-guild dashboard config or `FORUM_CHANNEL_IDS` env default), thread creation/rotation, keepalive polling, archive-at-size (`THREAD_MAX_MESSAGES`, default 100).
  - Schema v5: `feeds.thread_channel_id`/`thread_entry_count`; `discord_guilds.threads_enabled`/`forum_channel_ids`.
  - Config via dashboard **Feeds tab** (per server, not host-only) or env (`FORUM_CHANNEL_IDS`, `THREAD_KEEPALIVE_ENABLED`, `THREAD_KEEPALIVE_INTERVAL_MS`, `THREAD_KEEPALIVE_GRACE_MS`, `THREAD_MAX_MESSAGES`).
  - Legacy channel delivery is unchanged for guilds without thread delivery enabled.

### 10. Dashboard Guild-Centric Rework, Landing Page Audit, Manual Polling Removal & Free Games Scheduling 🟩 Complete (per [#21](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/21))
- **Problem**: The dashboard is per-feed with large cards and per-feed channel pickers, which does not scale. Manual polling is unreliable for several sources. The landing page still advertises retired and unsupported features. Free Games scheduling was unstable; the final design polls once weekly on Sundays (adjusted in #14) to avoid duplicate alerts.
- **Status**: Complete — tracked in [#21](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/21). All phases (1-16) implemented and pushed.
- **Supported sources locked**: **RSS/Atom/JSON (including News presets), Reddit, Free Games**. YouTube & Twitch are supported as **live-stream + upload/online alerts** (delivered primarily via webhooks with periodic polling fallback; `feedCategory` → `streamalerts`), **not** as RSS-fetch feed types. TikTok and Bluesky are **not supported**.
  - Channel/thread assignment is **per guild, per category** (`rss`, `reddit`, `freegames`, `streamalerts`), not per individual feed.
  - Manual polling endpoints/buttons removed entirely.
  - Free Games polls **weekly on Sunday (UTC)** and posts only new giveaways (see #14).
  - **Product expansion (tracked in [#21](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/21), Phases 11+):** dashboard **Feeds primary tab** with per-feed sub-pages, **Guild Admin** page + administration commands, and entertainment GIF commands (KLIPY — later **retired** in #17).
  - The project/development name is **HELIX Discord Bot** (renamed from HELIX RSS); the dashboard and bot embeds keep using the live Discord application name + icon at runtime.

### 11. Lavalink Music Features Retirement 🟩 Resolved / ♻️ Retired
- **Problem**: Music playback using Lavalink required ongoing maintenance overhead, voice connection fragility, and unnecessary complexity.
- **Resolution**:
  - All music playback commands, modules, routes, dashboard views, Lavalink management, and `ws` dependencies were completely removed and retired.
  - Removed DJ role configuration and music feature flags.
  - Discord bot and dashboard remain streamlined on feed syndication, alerts, and administration. (GIF entertainment was later added #12 and **retired #17**.)

### 12. Entertainment GIF Commands — KLIPY Integration 🟩 Resolved / ♻️ Retired (per #17)
- **Problem**: No entertainment/reaction GIF commands.
- **Resolution**:
  - Added `/gif [category]` with Discord autocomplete (25+ categories: anime, jojo, waifu, slap, gintama, doggo, cat, etc.).
  - Added 14 action-style convenience commands (`/slap`, `/hug`, `/kiss`, `/pat`, `/bonk`, `/cuddle`, `/tickle`, `/pet`, `/poke`, `/baka`, `/smug`, `/cry`, `/angry`, `/meme`) mapping to KLIPY tags.
  - KLIPY API integration (public, no auth) with graceful fallback.
  - Gated by `GIFS_ENABLED` feature flag (default `true`).
- **Note**: **Retired and removed in #17** — all 22 GIF commands deleted, `GIFS_ENABLED`/`KLIPY_API_KEY` removed, `wiki/Entertainment.md` deleted.

### 13. Guild Administration & Moderation Commands 🟩 Resolved
- **Problem**: Monolithic command architecture risked hitting Discord limits; server moderation and voice controls needed proper modular separation per discord.js v14 standards.
- **Resolution**:
  - **Moderation commands** in dedicated files under `src/bot/commands/mod/`: `/kick`, `/ban`, `/warn`, `/purge`, `/slowmode`, `/lock`, `/unlock`, `/announce`.
  - **Admin commands** under `src/bot/commands/admin/`: `/role add|remove|list`, `/voice mute|unmute|deafen|undeafen|move|disconnect`, `/set` (role/feature/prefix/view/reset), `/welcome`, `/ticket`, `/server` (export/import/command).
  - All commands enforce Discord native permissions (`default_member_permissions`), role hierarchy (`canManageMember` in `src/bot/lib/admin/permissions.ts`), and case-numbered mod log embeds (`src/bot/lib/admin/modlog.ts`).
  - Mod log channel is a guild setting (`mod_log_channel_id`) read by `modlog.ts`, persisted in `guild_settings`, exported/imported via `/server export|import`.
  - Gated by `ADMINISTRATION_ENABLED` feature flag (default `true`).
  - Documentation: `wiki/Administration.md`, `wiki/Discord-Bot.md`.

### 14. Forum Single-Thread Per Source & Weekly Sunday Free Games 🟩 Resolved
- **Problem**: Each RSS post created a new forum thread instead of sticking to one dedicated thread per source. Free Games was duplicating posts during daily polling.
- **Resolution**:
  - Enforced single thread per feed in `src/feed/threads.ts`: automatically unarchives archived threads and persists existing thread IDs in memory and SQLite.
  - Free Games schedule adjusted to poll strictly once per week at the start of Sunday (`getUTCDay() === 0`), completely eliminating duplicate mid-week alerts.

### 15. Discord.js Standard Rebuild & Modular Command Architecture 🟩 Resolved
- **Problem**: Monolithic legacy command implementations risking Discord's 4,000 character and 25 option/choice limits; inconsistent embed formatting.
- **Resolution**:
  - Entire agent ecosystem rebuilt (`AGENTS.md`, `.agents/rules/`, `.agents/agents/`, `.agents/skills/`, `.agents/templates/`).
  - Strict Rule 06: mandatory discord.js v14 standards, zero magic numbers. Subcommands and options stay colocated within their respective command files in `src/bot/commands/<category>/<command>.ts` for clear scoping.
  - `src/bot/lib/` is exclusively dedicated to reusable libraries, modules, and utilities (e.g. `embeds/`, `admin/`, `feeds/`).
  - Standardized `EmbedHandler` enforcing strict title/description/field length limits.

### 16. Professional Modular Dashboard Rebuild 🟩 Resolved
- **Problem**: Monolithic 2,371-line `dashboard.ts` mixing stylesheet, HTML markup for 8 flat unorganized tabs, and 1,300 lines of client-side JavaScript.
- **Resolution**:
  - Modularized dashboard view components into `src/dashboard/views/dashboard/`:
    - `styles.ts`: Theme-aware CSS stylesheet with modern Discord-style navigation, card borders, pills, badges, and responsive layouts.
    - `sidebar.ts`: Professional categorized sidebar (**General**, **Feeds & Alerts**, **System**) with active server switcher banner and footer links.
    - `overview.ts`: Executive server overview tab with live stat metrics, delivery channel status, and recent activity logs.
    - `feeds.ts`: News feeds catalog presets, custom RSS/Atom/Scrape creator, topic groupings, and feed setup drawer.
    - `sources.ts`: Specialized views for Reddit streams, Free Games store drops, and Stream Alerts.
    - `guildadmin.ts`: Guild administration tab for Admin role, feature toggles, and command prefix.
    - `settings.ts`: Host settings view for public/internal endpoints, active theme engine info, and registered team members.
    - `client-script.ts`: Browser client script for routing, feed CRUD, preset toggles, modal dialogs, and real-time updates.
  - Adheres strictly to Rule 07 (zero external frontend runtime dependencies, SSR HTML + CSS Custom Properties, Discord OAuth2).

### 17. Entertainment GIF Commands Retirement & Removal 🟩 Resolved / ♻️ Retired
- **Problem**: GIF commands powered by the upstream KLIPY API were broken and non-functional. External entertainment APIs added maintenance overhead and runtime fragility.
- **Resolution**:
  - Completely retired and removed all 22 entertainment slash commands (`/gif`, `/slap`, `/hug`, `/kiss`, `/pat`, `/bonk`, `/cuddle`, `/tickle`, `/pet`, `/poke`, `/baka`, `/smug`, `/cry`, `/angry`, `/meme`, `/anime`, `/jojo`, `/waifu`, `/amongus`, `/doggo`, `/gintama`, `/triggered`).
  - Removed `src/bot/commands/entertainment/` and `src/bot/utils/klipy.ts`.
  - Removed `'entertainment'` category from command loader and registry.
  - Removed `GIFS_ENABLED` and `KLIPY_API_KEY` configuration options and feature flags across backend, `.env.example`, and dashboard guild admin.
  - Synchronized documentation: `wiki/Entertainment.md` removed, README + AGENTS.md updated.