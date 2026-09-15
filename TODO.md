# HELIX Discord Bot — Roadmap & Pending Work

Tracked issues: [#21](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/21)

---

## ✅ Completed (All checks pass: `npm run check` ✅, `npm run build` ✅)

- **Switch NodeLink → Lavalink** (`866706e`, then `3fe7c26`):
  - Feature flag: `NODELINK_ENABLED` → `LAVA_ENABLED` (env var)
  - Config: `NodeLinkConfig` → `LavalinkConfig`, env `NODELINK_*` → `LAVA_*`
  - Default Lavalink password: `youshallnotpass`
  - Renamed `NodeLinkManager` → `LavalinkManager`
  - Removed internal NodeLink server startup; external Lavalink only
  - Dashboard UI: "NodeLink" → "Lavalink"
  - Command descriptions shortened (<70 chars)
  - Removed `ioredis` dependency; `ioredis-mock` only
  - Removed `@types/ioredis-mock` dev dep
  - PostgreSQL/MySQL removed from DB_URI (SQLite only)

- **Infrastructure simplification**:
  - `src/bot/music/nodelink.ts` deleted
  - Redis coordination uses ioredis-mock only (no external Redis)
  - Removed unused imports (`spawn`, `fileURLToPath`, `resolve`)
  - README/wiki updated with Lavalink references

- **Bug 1 Fix: "Cannot send an empty message"** (`bot.ts`):
  - `interaction.reply(response)` now sends `(response as { data?: unknown }).data ?? {}`
  - `interaction.followUp(response)` same conversion
  - Error-response catch-block now sends `errorResponse.data` instead of envelope
  - Fixes ALL slash commands returning `{type, data}` REST payload shape

- **Bug 2: One-or-the-other channel/thread per category**:
  - `/set channel` subcommand: `channel` and `thread_channel` optional; require exactly one; reject if both provided (400 + alert)
  - Dashboard Categories tab: mutual exclusion enforced — selecting a text channel clears thread select and vice versa (`categoryTargetChanged` handler)
  - Dashboard `saveCategoryTarget`: rejects if both channelId + threadChannelId non-null (alert + abort)
  - API PUT `/api/guilds/:guildId/categories/:category`: 400 if both provided
  - `handleSetView` renders per-category: "Delivers to <#channel>" OR "Delivers as threads in <#thread>"
  - `enablePreset`: now accepts either `rssTarget.channelId` OR `rssTarget.threadChannelId`
  - README/wiki: "per-guild per-category delivery must be EITHER a text channel OR a forum-thread target — never both simultaneously"

- **Citation**: CITATION.cff title → "HELIX Discord Bot", version 0.4.0

- **Environment key rename**: `NODELINK_*` → `LAVA_*` (in `.env`, `.env.example`, `src/config.ts`)

- **Archival cleanup**:
  - `git rm --cached` and added to `.gitignore`: `PLAN.md`, `comment-phase8.json/md`, `issue21-body.md`, `issue21-patch.json`
  - `.gitignore` updated: `comment-*.json/md`, `issue21-*.md/json`

- **All references cleaned**:
  - `CONTRIBUTING.md:86` updated from "SQLite / PostgreSQL persistence"
  - Wiki Troubleshooting.md, Reddit-Feeds.md, Configuration.md updated from USER_AGENT `HelixRSS/0.1.0` to current

---

## 📋 Remaining Work (Tracked in #21)

### Phase 11+ (Dashboard + Admin Commands)
- **Dashboard Feeds primary tab** — per-feed sub-pages (not per-category cards)
- **Guild Admin page** + administration commands (`/admin`, `/admin config`, etc.)
- **Entertainment GIF commands** (KLIPY API integration: `/gif`, `/slap`, `/hug`, etc.)
- **Music Queue Management** dashboard page (now using Lavalink, not NodeLink)

### Feature Flags (already wired)
- `FEEDS_ENABLED`, `STREAM_ALERTS_ENABLED`, `THREADS_ENABLED`, `GIFS_ENABLED`
- `ADMINISTRATION_ENABLED`, `NODELINK_ENABLED` (deprecated — removed)
- `DASHBOARD_ENABLED`, `ADMIN_PANEL_ENABLED`
- Bot command registration respects `getEnabledCommands(deps)`

### Known Remaining Issues
1. ~~`/play` "Cannot send an empty message"~~ ✅ **Fixed** via bot.ts reply/.data mapping
2. ~~Force both text channels and rss together~~ ✅ **Fixed** — one-or-the-other enforced per category
3. ~~Set threads enabled on VPS (ws://127.0.0.1:2333)~~ — Lavalink not running on VPS; connect to own Lavalink server
4. ~~Dashboard guild category mutual exclusion~~ ✅ **Implemented**
5. ~~enablePreset requires channelId~~ ✅ **Fixed** — accepts threadChannelId too

---

## 🛠️ Development Tooling

### Verification Commands
```
npm run check    # typecheck + format + lint (must pass)
npm run build    # tsc compile (must pass)
npm test          # vitest run  (if test suite added later)
```

### Code Quality
- ESLint: `eslint src --max-warnings 0` (zero warnings)
- Prettier: `prettier --check src` (all files formatted)
- TypeScript: `tsc --noEmit` (no type errors)

### File Structure (src/)
```
app.ts                # AppDeps, startup
bot/                  # commands/, events/, rest.ts, music/lavalink.ts
dashboard/            # routes/, views/ (giant template-literal dashboard.ts)
db/                   # repository.ts + repositories/
feed/                 # watcher.ts, listener.ts, threads.ts, presets.ts, targets.ts
scheduler/            # polling orchestration
state/                # types.ts, redis.ts (ioredis-mock only)
util/                 # logger.ts
```

---

## 📅 Phase Roadmap (from #21, Phases 1–16 complete)

```
1  Dashboard landing page
2  Gitignored archive cleanup
3  Version sync 0.1.0 → 0.4.0
4  Env key rename NODELINK_* → LAVA_*
5  Stale NodeLink references cleaned
6  Persistence simplification (ioredis-mock + SQLite)
7  Theme support (light/dark + auto-detect)
8  Site status monitors retirement
9  Cloud hosting retirement (Heroku/Render/Fly.io/Railway/Vercel)
10 Dashboard guild-centric rework
11 Feeds primary tab (per-feed sub-pages) — TODO
12 Guild Admin page + admin commands — TODO
13 Entertainment GIF commands (KLIPY) — TODO
14 Music queue management dashboard — TODO
15+ Additional feature expansion
```

---

## 🧩 Agent Team Reference

| Agent | Current Focus |
|-------|--------------|
| Orchestrator | Tracking #21 phases |
| Code Architect | Lavalink migration + infra simplify |
| Test Automation | No test suite yet |
| Security Auditor | Env key management, secrets handling |
| Feed Watcher | Thread delivery, feed polling |

---

## 🔖 Metadata
- **Project**: HELIX Discord Bot
- **Current version**: 0.4.0
- **Default Lavalink password**: `youshallnotpass`
- **Env vars**: `LAVA_HOST/PORT/PASS/SECURE` (Lavalink), `DISCORD_TOKEN`, `SQLITE_DATA`
- **Build**: `npm run build` outputs `dist/`
- **Checks**: `npm run check` (typecheck + format + lint)
- **Remote**: `main` at `https://github.com/HELIX-Origin/HELIX-Discord-Bot.git`
- **Branch**: `main`