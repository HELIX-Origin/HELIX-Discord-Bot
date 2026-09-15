# 🧭 Dashboard Guild-Centric Rework + Fix Work + Landing Page Audit + Daily Free Games Polling

> **Status:** ✅ **All Phases 1-16 Complete** — The guild-centric rework, daily free games, Feeds primary tab, Guild Admin, GIF/KLIPY, Music via NodeLink + Queue, Integration Polish, and Rebrand are all **complete and pushed**.

---

## 🛠️ Current Maintenance & Fix Work (Complete)

All items from the maintenance/fix work section are resolved and verified:

### URL & OAuth Handling Fixes
- **`PORT`/`DISCORD_PORT` retired** — the bot port resolves exclusively from `INTERNAL_URL` (default `3131`); no `PORT`-style env vars are read.
- **`DISCORD_CALLBACK_URL` is the explicit OAuth callback** — when set in `.env` it is used verbatim; otherwise callbacks derive from `PUBLIC_URL` (no port injection) and fall back to `INTERNAL_URL`-based localhost so local-only instances still work.
- **DB-persisted `public_base_url` override removed** — the dashboard "Public Base URL" editor is gone; config is exclusively via `.env`.
- **Keep-alive network ping retired** — `src/util/keep-alive.ts` and the `PING_*`/`KEEP_ALIVE*` envs were removed; only `THREAD_KEEPALIVE_*` remain for forum-thread delivery keepalive.
- **Hardcoded URL/IP residues** cleaned up across dashboard helpers and shared callback fallback.

### Dashboard Restructure (Path-Based Routing)
- `/guilds` becomes the **guild selection page**.
- `/dashboard/{guildId}` is the **per-guild dashboard**.
- `/dashboard/{guildId}/{page}` are **dashboard sub-pages** (Feeds, Settings, Admin, Queue).
- Dev Tools moved to user badge dropdown (owner/team only), no longer a sidebar tab.
- All navigation uses in-memory `history.pushState` routing.

### Dashboard Updates
- Login button restored in the top bar on all pages.
- Theme toggle removed — theme & color scheme are configured entirely via `.env` (`DASHBOARD_THEME`/`DASHBOARD_COLOR_SCHEME`).
- Removed the "All" type option for supported feeds — users pick specific feeds/sources via capability cards.
- Free Games customization top bar removed — just enable/disable cards remain.
- Settings page made public with an owner-only section.

### Bug Fixes from Codebase Audit
- **Feed type lost on DB hydration** — `rowToFeed` preserves the full `FeedType` union.
- **Duplicate `WebhookRouter` instance** — consolidated to single shared instance via `deps.webhookRouter`.
- **Webhook listener dedup** — entries no longer marked sent on Discord delivery failure.
- **Hardcoded URL/IP residues** cleaned up.

---

## 🎯 Background & Goals

The dashboard was reorganized from per-feed cards to **per-guild, per-category** targets. The bot expanded into a full **guild management + entertainment + music platform**:

- **Music playback** backed by **NodeLink** (native YouTube, Spotify, SoundCloud, Apple Music, Deezer) with a **queue management page**.
- **Guild administration & management commands** for moderating and configuring servers.
- **Entertainment commands** using **KLIPY API** for GIFs.
- **Dashboard architecture** with **Feeds as primary tab**, dedicated **Guild Admin**, **Queue**, **Settings**, and **Dev Tools** (badge dropdown).

## 🔒 Design Decisions (locked)

| Area | Decision |
| --- | --- |
| Supported content sources | **RSS/Atom/JSON Feeds** (including News presets), **Reddit**, **Free Games**, **YouTube**, **Twitch**. YouTube & Twitch are **live-stream + upload/online alerts** (`feedCategory` `streamalerts`). *TikTok and Bluesky not supported.* |
| Channel/thread assignment | **Per guild, per category** (`rss`, `reddit`, `freegames`, `streamalerts`). All feeds in that category inherit it. |
| Thread delivery | Category-level forum-thread target optional; each feed posts into its per-feed thread. |
| Manual polling | **Removed** per-feed Test/Trigger Poll buttons, free-games manual poll endpoint, Dev Tools "Poll All Feeds Now". Polling stays fully automatic. |
| Free Games schedule | **Daily** poll (replaced weekly Monday cron). Posts only new giveaways. |
| Landing page | Audited against actual features. Removed retired cloud hosting, status monitors, webhooks, unsupported platforms. |
| Dashboard routing | Path-based: `/guilds`, `/dashboard/{guildId}`, `/dashboard/{guildId}/{page}`. In-memory `history.pushState`. |
| Pages | **Feeds** (primary tab; each feed = sub-page) · **Guild Admin** · **Queue** · **Settings** · **Dev Tools** (owner/team, in badge dropdown). |
| Music | **NodeLink** with native YouTube, Spotify, Apple Music, Deezer, SoundCloud — no plugins required. `YOUTUBE_API_KEY` optional. External NodeLink via `NODELINK_EXTERNAL=true`. |
| Entertainment | **GIF commands via KLIPY API** (category-based, trending, search). |
| Guild admin commands | Moderation/configuration slash commands (warn, kick, lock, purge, announce, roles, etc.). Slash + components only. |

---

## 🎵 Music / NodeLink Decision

### Architecture
NodeLink runs as a separate process (self-hosted sidecar or external node). The bot connects as a WebSocket + REST client.

### NodeLink Lifecycle
- **Default: internal** — runs at startup on `localhost:2333` (SSL false, password `youshallnotpass`).
- **External mode** — set `NODELINK_EXTERNAL=true` + configure `NODELINK_HOST/PORT/SECURE/PASSWORD` to connect to external NodeLink.
- Dashboard Admin Panel (owner/team) shows NodeLink runtime status.
- If no NodeLink node is up, music commands degrade gracefully.

### Environment Variables
| Section | Variable | Purpose |
|---|---|---|
| `NODELINK` | `NODELINK_HOST` | NodeLink server hostname (default `127.0.0.1`) |
| | `NODELINK_PORT` | Port (default `2333` internal, `443` external) |
| | `NODELINK_SECURE` | WSS vs WS (`true`/`false`) |
| | `NODELINK_PASSWORD` | Server password (default `youshallnotpass`) |
| | `NODELINK_EXTERNAL` | Connect to external node instead of starting internal (`true`/`false`, default `false`) |
| `YOUTUBE` | `YOUTUBE_API_KEY` | Optional YouTube Data API v3 key |
| | `YOUTUBE_CLIENT_ID` | Google OAuth client ID (for stream/upload alerts) |
| | `YOUTUBE_CLIENT_SECRET` | Google OAuth client secret |
| `SPOTIFY` | `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| | `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |
| `FEATURES` | `NODELINK_ENABLED` | Master switch for music/NodeLink (`true`/`false`) |

### Bot Commands (gated by `NODELINK_ENABLED`)
`/play <query>`, `/queue`, `/skip`, `/nowplaying`, `/shuffle`, `/loop`, `/volume`, `/pause`, `/resume`, `/stop`, `/seek`, `/previous` (alias `/back`), `/leave`.

### Dashboard Queue Management
**Queue Management page** (`/dashboard/{guildId}/queue`): live queue, now playing, up next, reorder/remove/skip/clear, volume & loop controls.

---

## 😂 Entertainment / GIF Decision

- Primary command: **`/gif [category]`** — single command with optional category filter.
- Subcommands (popular KLIPY tags): `anime`, `jojo`, `waifu`, `slap`, `gintama`, `doggo`, `cat`, `hug`, `kiss`, `pat`, `bonk`, `cuddle`, `tickle`, `pet`, `poke`, `baka`, `smug`, `cry`, `angry`, `meme`.
- `/gif` without category returns random GIF.
- Action commands: `/slap`, `/hug`, `/kiss`, `/pat`, `/bonk`, `/cuddle`, `/tickle`, `/pet`, `/poke`, `/baka`, `/smug`, `/cry`, `/angry`, `/meme` — each maps to its KLIPY tag.
- Gated by `GIFS_ENABLED` flag.

---

## 📋 Phases & Progress

### Phase 1 — Cleanup Unsupported Sources & Landing Page Audit ✅
### Phase 2 — Data Model for Guild-Category Targets ✅
### Phase 3 — Dashboard Guild Selection & Category UI ✅
### Phase 4 — Remove Manual Polling ✅
### Phase 5 — Free Games Daily Schedule ✅
### Phase 6 — URL & OAuth Handling Fixes ✅
### Phase 7 — Keep-Alive Network Ping Retirement ✅
### Phase 8 — Dashboard UX Updates ✅
### Phase 9 — Audit Bug Fixes ✅
### Phase 10 — Validation & Release ✅ (`npm run check` + `npm run build` pass)
### Phase 11 — Feeds Primary Tab + Sub-Pages ✅
### Phase 12 — Guild Administration & Management ✅
### Phase 13 — Entertainment Commands (GIF via KLIPY) ✅
### Phase 14 — Music Playback via NodeLink + Queue Management ✅
### Phase 15 — Integration Polish & Docs ✅
### Phase 16 — Rebrand: HELIX RSS → HELIX Discord Bot ✅

---

## ⚠️ Risks & Constraints
- Category target migration may need migration for existing feeds.
- Free-games daily polling increases request frequency; consider per-store caching.
- Forum thread per category: all feed threads in same forum; rotation per-feed.
- `/feed add` may need update to inherit category target.
- NodeLink is external runtime dependency — degrades gracefully when unavailable.
- YouTube stream/upload alerts require `YOUTUBE_CLIENT_ID`/`YOUTUBE_CLIENT_SECRET`.
- KLIPY API requires key — entertainment commands degrade gracefully without it.
- Music voice connection adds WebSocket/REST state; must not interfere with feed/event loop.

---

## ✅ Acceptance Criteria — All Met
- Guild selection page before managing feeds ✅
- Per-guild per-category channel/thread target ✅
- Compact feed pills, not large cards ✅
- Manual polling UI/endpoints removed ✅
- Free Games daily poll, only new giveaways ✅
- Landing page/docs reflect actual features ✅
- Discord OAuth works behind domain/tunnel with explicit `DISCORD_CALLBACK_URL` ✅
- Settings page accessible to guild admins, owner-only section ✅
- Path-based routing with in-memory navigation ✅
- Feeds primary tab; every feed has sub-page ✅
- Guild Admin page + admin slash commands with permission checks ✅
- GIF/entertainment commands work with KLIPY key, degrade gracefully ✅
- Music commands + Queue page work with NodeLink, degrade gracefully ✅
- Internal NodeLink runs at startup; external mode via `NODELINK_EXTERNAL=true` ✅
- Bot `/help` grouped: Feeds, Admin, Entertainment, Music ✅

---

## 📚 Related
- `AGENTS.md`, `PLAN.md`, `temp.md`
- Landing page: `src/dashboard/views/landing.ts`
- Feed watcher / free games: `src/feed/watcher.ts`, `src/feed/freegames.ts`
- Dashboard: `src/dashboard/views/dashboard.ts`, `src/dashboard/routes/`
- Wiki: `wiki/HOME.md`, `wiki/Free-Games-Feeds.md`, `wiki/API-Reference.md`