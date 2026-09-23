# ⚙️ Configuration & Environment Variables

HELIX Discord Bot is configured entirely via environment variables defined in a `.env` file at the root of the project. The service reads it automatically on `npm start` (`node --env-file-if-exists=.env`).

> **Note**: Because the service is self-hosted, there is **no in-dashboard credential editor**. All secrets and settings live in `.env` only — see [Rule 00](../AGENTS) for the safety contract.

---

## 📋 Complete Environment Variable Reference

### 🤖 Discord Bot Configuration

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `DISCORD_TOKEN` | For bot | — | Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications). The bot starts automatically when set. |
| `DISCORD_CLIENT_ID` | For login | — | Discord Application Client ID. |
| `DISCORD_CLIENT_SECRET` | For login | — | Discord OAuth2 Client Secret used for dashboard authentication. |
| `DISCORD_REDIRECT_URL` | No | Auto-built invite URL | Bot Invite / Authorization URL shown in the dashboard header and Dev Tools. |
| `DISCORD_CALLBACK_URL` | No | `http://<host>:<port>/api/auth/callback/discord` | OAuth2 redirect callback URI. Must match the Developer Portal entry exactly. |
| `DISCORD_API_BASE_URL` | No | `https://discord.com/api/v10` | Override the Discord REST API base URL (e.g. for a self-hosted Discord API proxy). |

### 🌐 Networking & Ports

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `INTERNAL_URL` | No | `127.0.0.1:3131` | Bind host and port for both the web dashboard and the Discord bot endpoints (e.g. `127.0.0.1:3131` or `0.0.0.0:3131`). The port is derived exclusively from this variable; there are **no PORT-style environment variables**. |
| `HOST` | No | `127.0.0.1` | Host override when `INTERNAL_URL` does not specify one. |
| `PUBLIC_URL` | No | `INTERNAL_URL` | Public URL of the instance when accessed via a domain/reverse proxy/tunnel (e.g. `https://rss.yourdomain.com`). A public subdomain hides the internal port — the proxy maps `subdomain.domain` to the internal `host:port`. Used to build OAuth callbacks and dashboard links. Aliases: `CUSTOM_URL`, `CUSTOM_DOMAIN`. |

> ℹ️ The old Express-era `PORT` / `PUBLIC_BASE_URL` variables have been retired. Use only `INTERNAL_URL` (internal binding) and `PUBLIC_URL` (public address). For the Discord OAuth redirect, set `DISCORD_CALLBACK_URL` to the exact URI registered in the Discord Developer Portal.

### 📦 Repository & User-Agent Identification

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `REPO_URL` | No | — | Repository URL used in Discord REST requests, feed fetchers, and dashboard "GitHub" links. Aliases: `GITHUB_REPO`, `REPOSITORY_URL`, `PROJECT_URL`. |
| `USER_AGENT` | No | `DiscordBot (<REPO_URL>, 0.5.0)` | Custom HTTP User-Agent sent with outgoing requests. Alias: `DISCORD_USER_AGENT`. |

### 🗂️ Logging & Timeouts

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `LOG_LEVEL` | No | `info` | `debug` \| `info` \| `warn` \| `error`. |
| `REQUEST_TIMEOUT_MS` | No | `15000` | HTTP request timeout for fetching remote feeds (milliseconds). |
| `POLL_INTERVAL_MS` | No | `60000` | Automated feed background polling check cadence (default 1 minute). |

### 💾 Persistence

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `SQLITE_DATA` | No | `./data` | Directory that stores the `database.sqlite` SQLite file (native `node:sqlite`, WAL mode). |

> SQLite is the only supported database engine; there is no PostgreSQL/MySQL support.

---

### 🧵 Thread Delivery (Optional)

Thread delivery is a **per-server** feature — when enabled, each feed delivers into its own dedicated thread **auto-created in the feed's configured text channel** (one thread per feed, named after the feed). Toggle it per server from the dashboard **Guild Admin tab → Feed Delivery**, or via `PUT /api/guilds/:guildId/settings` with `body.threadsEnabled`. A global master switch backs it up:

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `THREADS_ENABLED` | No | `true` | Global master switch for thread delivery. When `false`, feeds always deliver directly to their channel even if a server enables the per-server toggle. |
| `THREAD_KEEPALIVE_ENABLED` | No | `true` | Set to `false` to stop polling feed threads to keep them open. Alias: `KEEP_THREADS_OPEN=false`. |
| `THREAD_KEEPALIVE_INTERVAL_MS` | No | `21600000` | How often the keepalive pass checks open feed threads (default 6 hours). |
| `THREAD_KEEPALIVE_GRACE_MS` | No | `86400000` | Post a keep-alive message once a thread is within this window of its auto-archive time (default 24 hours ≈ once/week per thread). |
| `THREAD_MAX_MESSAGES` | No | `100` | Rotate a feed's thread after this many delivered entries: the large thread is archived/locked and a fresh thread opens in its place. |

> Threads auto-archive if left idle. The keepalive pass polls each open feed thread and posts a tiny message shortly before Discord would archive it, so active feeds stay visible. Threads that grow past `THREAD_MAX_MESSAGES` are auto-rotated (archived + fresh thread).

### 🎨 Dashboard Appearance

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `DASHBOARD_THEME` | No | `dark` | `glassmorphism` \| `dark` \| `light` \| `cyberpunk` \| `dracula` \| `nord` \| `emerald`. Aliases: `DEFAULT_THEME`, `THEME`. Each theme provides its own accent color palette. |
| `LANDING_PAGE_ENABLED` | No | `true` | Set to `false` to disable the landing page at `/` and redirect straight to `/dashboard`. Alias: `ENABLE_LANDING_PAGE`. |
| `FEED_CATEGORY_LIMITS` | No | `rss=10,reddit=10` | Per-tab feed subscription caps as a CSV of `category=number` pairs (e.g. `rss=15,reddit=20`). Supported categories: `rss`, `reddit`, `freegames`, `streamalerts`. Set a category to `0` to make it unlimited. Categories not mentioned keep their defaults. |

### 🚩 Feature Flags

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `FEEDS_ENABLED` | No | `true` | RSS/Reddit/Free Games feed delivery. |
| `STREAM_ALERTS_ENABLED` | No | `true` | YouTube/Twitch live & upload alerts. |
| `THREADS_ENABLED` | No | `true` | Thread delivery support (global master switch; per-guild toggle decides per server). |
| `ADMINISTRATION_ENABLED` | No | `true` | Moderation, roles, and voice administration commands. |
| `DASHBOARD_ENABLED` | No | `true` | Web dashboard & REST API. |
| `ADMIN_PANEL_ENABLED` | No | `true` | Developer tools / admin panel. |

---

## ⏱️ Feed Polling & Delivery Intervals
 
- Automated background polling runs continuously on a **1-minute cadence** (`POLL_INTERVAL_MS=60000`).
- Feed polling intervals can also be customized per-user or globally in the dashboard (`1 minute`, `10 minutes`, `30 minutes`, or `1 hour`).
- Every feed cycle delivers **strictly the single newest post** on arrival and drains the older backlog to eliminate burst spam and avoid Discord rate limits.

---

## 📝 Sample `.env` Template

Start from the repository's `.env.example`:

```env
# Internal bind address and port
INTERNAL_URL=127.0.0.1:3131

# Public URL (domain / reverse proxy)
PUBLIC_URL=http://localhost:3131

# Repository & User-Agent identification
REPO_URL=https://github.com/HELIX-Origin/HELIX-Discord-Bot
USER_AGENT=

# Logging
LOG_LEVEL=info

# Request timeout for remote feeds
REQUEST_TIMEOUT_MS=15000

# SQLite data directory
SQLITE_DATA=./data

# Discord Bot credentials (bot starts when DISCORD_TOKEN is set)
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# Bot Invite / Authorization URL
DISCORD_REDIRECT_URL=https://discord.com/oauth2/authorize?client_id=your_client_id&permissions=8&integration_type=0&scope=bot+applications.commands

# Optional: Thread Delivery (per-server toggle, dashboard configurable)
# THREADS_ENABLED=true
# THREAD_KEEPALIVE_ENABLED=true
# THREAD_KEEPALIVE_INTERVAL_MS=21600000
# THREAD_KEEPALIVE_GRACE_MS=86400000
# THREAD_MAX_MESSAGES=100

# Optional: Dashboard theme & landing page
DASHBOARD_THEME=dark
LANDING_PAGE_ENABLED=true

# YouTube API credentials (optional — YouTube alerts use public Atom feeds out-of-the-box with zero keys required)
YOUTUBE_API_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

# Twitch API credentials (for Twitch Stream Alerts)
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=

# Global Feature Flags (defaults to true unless noted)
FEEDS_ENABLED=true
STREAM_ALERTS_ENABLED=true
THREADS_ENABLED=true
ADMINISTRATION_ENABLED=true
DASHBOARD_ENABLED=true
ADMIN_PANEL_ENABLED=true
```