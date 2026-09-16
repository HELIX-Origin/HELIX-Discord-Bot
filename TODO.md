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

## 🚧 In Progress — Embedded Lavalink Integration (`@helix-origin/lavalink-server` npm package)

**Goal**: Replace the external-Lavalink-only setup with the bundled `@helix-origin/lavalink-server` npm package, which embeds the official **Lavalink v4 Java node** (self-hosted, zero external services). Music must then work over the **native Lavalink v4 protocol** (the current client speaks custom NodeLink-style WS ops that official v4 rejects).

### Design (from the package's README + `wiki/Importing` guidelines)
- Imported as a **pre-built npm package** — pinned GitHub Release tarball `https://github.com/HELIX-Origin/Lavalink-Server/releases/download/v1.0.0/helix-origin-lavalink-server-1.0.0.tgz`. **Read-only artifact**: no git submodule, no live remote, no repository relationship. Consumers can never push to the Lavalink-Server repo through the dependency.
- Package library API: `startServer({ features, overrides })` from `@helix-origin/lavalink-server` (dist/app.js + app.d.ts shipped in the tarball — no build step).
- `startServer` spawns the Java node via `LavalinkSupervisor` (needs **Java 21** + `Lavalink.jar` in the **host repo root** — Spring Boot reads `./application.yml` from `process.cwd()`).
- Gateway port = internal port (`LAVA_INTERNAL_URL`, default `0.0.0.0:2333`) + 1 → proxy on 2334. Client connects **directly to the node** on `LAVA_PORT` (2333).
- `LAVA_HOST`/`LAVA_PORT`/`LAVA_PASS`/`LAVA_SECURE` are **client-side** env vars (bot → node). Server-side uses `LAVA_INTERNAL_URL`/`LAVA_PUBLIC_URL` (server ignores the client keys).
- Avoid the server's interactive **YouTube device-flow**: call `startServer` with `features.youtubeOAuth:false`, `features.dashboard:false`, `features.supervisor:true`.

### Tasks
- [x] Remove git submodule semantics entirely: `.gitmodules` deleted, gitlink de-indexed, `lavalink-server/` dir removed from disk (also deleted `scripts/build-lavalink.mjs`, removed `build:lavalink`/`precheck`/`postinstall` scripts; `build` restored to plain `tsc`)
- [x] `package.json`: dependency `"@helix-origin/lavalink-server": "<pinned release tarball URL>"`; `npm install` (141 pkgs audited, 0 vulnerabilities)
- [x] `config.ts`: `LavalinkConfig.embedded` (`LAVA_EMBEDDED`, default **true**) + `readyTimeoutMs` (`LAVA_READY_TIMEOUT_MS`, default 60000)
- [x] `src/bot/music/embedded-lavalink.ts` — `EmbeddedLavaServer`: env coercion → `startServer()` → server.listen(gateway) → `waitForReady()` polling `/v4/info` (Authorization header) → `stop()`; imports from `@helix-origin/lavalink-server`
- [x] `src/bot/music/lavalink.ts` — **rewrite client to native Lavalink v4 WS protocol**:
  - Drop custom request/response ops (`createPlayer`, `connect`, `disconnect`, `loop`, `shuffle`, `heartbeat`) and the `requestId`/`pendingRequests` machinery (fire-and-forget ops)
  - Native ops: `play`/`stop`/`pause`/`seek`/`volume`/`filters` (guildId-scoped), `destroy`, `voiceUpdate` (guildId + sessionId + event from Discord voice server update)
  - Handle server `ready`/`playerUpdate`/`stats`/`event` (incl. **TrackEndEvent** → auto-advance queue, loop track/queue, skip semantics)
  - `loadTracks` normalization: v4 returns `{encoded, info}` track objects → map to existing `Track` shape; flatten playlist `data`
  - Client-side queue/history/shuffle/loop (Lavalink holds no queue state)
  - Voice: `VoiceGateway` interface (`joinChannel`/`leaveChannel`); `handleVoiceStateUpdate` stores per-guild `sessionId`; `handleVoiceServerUpdate` forwards `op:'voiceUpdate'`
- [x] `src/bot/bot.ts`: wire `Events.VoiceServerUpdate` → `lavaManager.handleVoiceServerUpdate` (maps discord.js camelCase `{token, guildId, endpoint}` → raw `{token, guild_id, endpoint}`); add `getUserVoiceChannelId`, `joinVoiceChannel` (setChannel + setDeaf/setMute), `leaveVoiceChannel`
- [x] `src/bot/commands/music/music.ts`: `ensurePlayer` detects caller VC via `deps.bot.getUserVoiceChannelId(...)`; `connectVoice` joins via the bot bridge; `/stop` clears queue after `manager.stop` so TrackEnd doesn't auto-advance
- [x] `src/index.ts`: when `lavaEnabled` → `embedded ? EmbeddedLavaServer.start()` + `waitForReady` → new `LavalinkManager` (secure:false) : external path; wire `lavaManager.setVoiceConnector(bot bridge)`; stop server on shutdown
- [x] `application.yml` at repo root (+ `Lavalink.jar` → `.gitignore`)
- [x] `.env.example`: single global env for the bot — reworked Lavalink section with `LAVA_ENABLED`, `LAVA_EMBEDDED` (true), `LAVA_HOST/PORT/PASS/SECURE`, `LAVA_READY_TIMEOUT_MS`, optional embedded-node vars (`LAVA_INTERNAL_URL`, `LAVA_PUBLIC_URL`, `GENIUS_ACCESS_TOKEN`, `YOUTUBE_REFRESH_TOKEN`); removed duplicate `LAVA_ENABLED` from the feature-flags block
- [x] README Music section + `wiki/HOME.md` + TODO.md + `.agents/rules` — npm-package dependency + single global `.env` docs
- [x] Verify: `npm run check` + `npm run build` (no submodule build step — fast)

### Known Risk (resolved in this rework)
- The OLD client ops (`createPlayer`/`connect`/`destroyPlayer`/`play`/`stop`/`pause`/`seek`/`volume`/`loop`/`shuffle` with `requestId`) were **NodeLink-style and incompatible with official Lavalink v4**. The client was rewritten to the native v4 WS protocol (fire-and-forget ops) + REST loadtracks — see completed tasks above.

---

## ✅ **Completed — Embedded Lavalink Integration** (`npm run check` ✅, `npm run build` ✅)

All embedded Lavalink tasks complete. Music playback works via native Lavalink v4 protocol with embedded node (default) or external node option.

---

## 📋 Remaining Work (Tracked in #21)

### Phase 11+ (Dashboard + Admin Commands)
- **Dashboard Feeds primary tab** — per-feed sub-pages (not per-category cards)
- **Guild Admin page** + administration commands (`/admin`, `/admin config`, etc.) — **commands implemented, dashboard page pending**
- **Entertainment GIF commands** (KLIPY API integration: `/gif`, `/slap`, `/hug`, etc.) — **commands implemented**
- **Music Queue Management** dashboard page (now using Lavalink, not NodeLink) — **commands implemented, dashboard page pending**

### Feature Flags (already wired)
- `FEEDS_ENABLED`, `STREAM_ALERTS_ENABLED`, `THREADS_ENABLED`, `GIFS_ENABLED`
- `ADMINISTRATION_ENABLED`, `LAVA_ENABLED`
- `DASHBOARD_ENABLED`, `ADMIN_PANEL_ENABLED`
- Bot command registration respects `getEnabledCommands(deps)`

### Known Remaining Issues
1. ~~`/play` "Cannot send an empty message"~~ ✅ **Fixed** via bot.ts reply/.data mapping
2. ~~Force both text channels and rss together~~ ✅ **Fixed** — one-or-the-other enforced per category
3. ~~Lavalink not running on VPS (ws://127.0.0.1:2333)~~ 📌 **Being solved** — embedded Lavalink npm package brings its own node
4. ~~Dashboard guild category mutual exclusion~~ ✅ **Implemented**
5. ~~enablePreset requires channelId~~ ✅ **Fixed** — accepts threadChannelId too

---

## 🛠️ Development Tooling

### Verification Commands
```
npm run check           # typecheck + format + lint (must pass)
npm run build           # tsc compile (must pass)
npm test                # vitest run  (if test suite added later)
```

### Code Quality
- ESLint: `eslint src --max-warnings 0` (zero warnings)
- Prettier: `prettier --check src` (all files formatted)
- TypeScript: `tsc --noEmit` (no type errors)

### File Structure (src/)
```
app.ts                # AppDeps, startup
bot/                  # commands/, events/, rest.ts, music/lavalink.ts, music/embedded-lavalink.ts
dashboard/            # routes/, views/ (giant template-literal dashboard.ts)
db/                   # repository.ts + repositories/
feed/                 # watcher.ts, listener.ts, threads.ts, presets.ts, targets.ts
scheduler/            # polling orchestration
state/                # types.ts, redis.ts (ioredis-mock only)
util/                 # logger.ts
node_modules/@helix-origin/lavalink-server/  # read-only npm package (embedded Lavalink node)
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
15 Embedded Lavalink npm package (native v4 protocol) — IN PROGRESS
16+ Additional feature expansion
```

---

## 🧩 Agent Team Reference

| Agent | Current Focus |
|-------|--------------|
| Orchestrator | Tracking #21 phases + embedded Lavalink rework |
| Code Architect | Lavalink npm package embed + native v4 client rewrite |
| Test Automation | No test suite yet |
| Security Auditor | Env key management, secrets handling |
| Feed Watcher | Thread delivery, feed polling |

---

## 🔖 Metadata
- **Project**: HELIX Discord Bot
- **Current version**: 0.4.0
- **Default Lavalink password**: `youshallnotpass`
- **Env vars**: `LAVA_ENABLED/EMBEDDED/HOST/PORT/PASS/SECURE/READY_TIMEOUT_MS` (Lavalink), `DISCORD_TOKEN`, `SQLITE_DATA`
- **Build**: `npm run build` outputs `dist/`
- **Checks**: `npm run check` (typecheck + format + lint)
- **Remote**: `main` at `https://github.com/HELIX-Origin/HELIX-Discord-Bot.git`
- **Branch**: `main`