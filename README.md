<div align="center">
  <!-- <img src="banner.png" width="100%" alt="HELIX Discord Bot Banner" /> -->

  # 📡 HELIX Discord Bot
  **A modern, self-hosted RSS, Web Scraper, Reddit, & Free Games syndication hub for Discord.**

  [![Version](https://img.shields.io/github/package-json/v/HELIX-Origin/HELIX-Discord-Bot?style=plastic&logo=github)](https://github.com/HELIX-Origin/HELIX-Discord-Bot/releases)
  [![License](https://img.shields.io/github/license/HELIX-Origin/HELIX-Discord-Bot?style=plastic)](LICENSE.md)
  [![Node.js](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FHELIX-Origin%2FHELIX-Discord-Bot%2Fmain%2Fpackage.json&query=engines.node&label=Node.js&logo=node.js&logoColor=white&color=339933&style=plastic)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/github/languages/top/HELIX-Origin/HELIX-Discord-Bot?style=plastic&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Issues](https://img.shields.io/github/issues/HELIX-Origin/HELIX-Discord-Bot?style=plastic)](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues)
  [![Stars](https://img.shields.io/github/stars/HELIX-Origin/HELIX-Discord-Bot?style=plastic&logo=github)](https://github.com/HELIX-Origin/HELIX-Discord-Bot)
  [![Last Commit](https://img.shields.io/github/last-commit/HELIX-Origin/HELIX-Discord-Bot?style=plastic)](https://github.com/HELIX-Origin/HELIX-Discord-Bot/commits/main)
  [![Discord](https://dcbadge.limes.pink/api/server/https://discord.gg/Ww3XBZC2HV?style=plastic)](https://discord.gg/Ww3XBZC2HV)
</div>

---

## 📖 Overview

**HELIX Discord Bot** is a lightweight, multi-user feed syndication engine and Discord bot built natively in TypeScript ESM. It automatically monitors RSS/Atom feeds, custom CSS webpage scrapers, curated subreddit streams, and weekly 100% OFF free game promotions—delivering clean, rich Discord embeds straight to your server channels without any webhook management overhead.

Featuring a built-in web dashboard, Discord OAuth2 authentication, zero frontend npm dependencies, SQLite persistent storage, and optional Redis clustering, HELIX Discord Bot provides everything you need to keep your Discord community informed in real time.

---

## ✨ Core Features

### 🎮 Free Games Giveaway Alerts
- **Multi-Platform Support**: Official support for **Epic Games Store**, **Steam**, **GOG.com**, **IndieGala**, **Humble Bundle**, **Itch.io**, **Ubisoft Store**, **EA App / Origin**, **Prime Gaming**, and **Battle.net**.
- **Automated Daily Drops**: Runs on an automated daily schedule with deduplication so limited-time giveaways are never missed.
- **Rich Store Embeds**: Standardized Discord embeds with official store branding, high-contrast badges, pricing worth, expiration timers, and direct claim links.

### 🎵 Music Playback via Lavalink
- **Multi-Source Support**: Native playback from **YouTube**, **Spotify**, **SoundCloud**, **Apple Music**, **Deezer**, and more via the official Lavalink v4 server.
- **Queue Management**: Full queue control with `/play`, `/queue`, `/skip`, `/previous`, `/shuffle`, `/loop`, `/volume`, `/seek`, `/nowplaying`, `/pause`, `/resume`, `/stop`, `/leave`.
- **Bundled Embedded Node (default)**: Ships the official Lavalink v4 engine as a pre-built npm dependency (`@helix-origin/lavalink-server`, installed as a pinned GitHub Release tarball — read-only, no repository linkage). The bot bootstraps the Java node in-process and supervises it — no external audio services required. Requires **Java 21+** and a `Lavalink.jar` placed in the project root next to `application.yml`.
- **External Node Option**: Set `LAVA_EMBEDDED=false` to connect to your own Lavalink v4 node via `LAVA_HOST`, `LAVA_PORT`, `LAVA_PASS`, `LAVA_SECURE` (`LAVA_SECURE=true` for `wss://`).
- **Single Global `.env`**: All music configuration lives in the bot's global `.env` — `LAVA_ENABLED`, `LAVA_EMBEDDED`, `LAVA_HOST/PORT/PASS/SECURE`, `LAVA_READY_TIMEOUT_MS`, plus optional `SPOTIFY_CLIENT_ID/SECRET`, `GENIUS_ACCESS_TOKEN`, `YOUTUBE_REFRESH_TOKEN` for the embedded node.

### ⚙️ Feature Flags
All major subsystems are gated by environment variables (default `true`):

| Flag | Controls |
| :--- | :--- |
| `FEEDS_ENABLED` | RSS/Reddit/Free Games feed delivery |
| `STREAM_ALERTS_ENABLED` | YouTube/Twitch live & upload alerts |
| `THREADS_ENABLED` | Forum thread delivery |
| `GIFS_ENABLED` | KLIPY `/gif` and action commands |
| `ADMINISTRATION_ENABLED` | `/admin` moderation, roles, voice |
| `LAVA_ENABLED` | Music playback (Lavalink) |
| `DASHBOARD_ENABLED` | Web dashboard & REST API |
| `ADMIN_PANEL_ENABLED` | Dashboard admin page |

Disable any flag to completely remove its commands, dashboard pages, and internal wiring.

### 😂 Entertainment GIF Commands
- **KLIPY-Powered GIFs**: `/gif [category]` with autocomplete for popular tags (anime, jojo, waifu, slap, gintama, doggo, cat, etc.).
- **Action Commands**: Convenience commands `/slap`, `/hug`, `/kiss`, `/pat`, `/bonk`, `/cuddle`, `/tickle`, `/pet`, `/poke`, `/baka`, `/smug`, `/cry`, `/angry`, `/meme` — each maps to its KLIPY tag internally.
- **Random GIF Fallback**: `/gif` without arguments returns a random GIF from the general pool.

### 🛡️ Guild Administration
- **Moderation Commands**: `/admin warn`, `/admin kick`, `/admin ban`, `/admin lock`, `/admin purge`, `/admin slowmode`, `/admin announce`.
- **Role Management**: Assign/remove roles, create role menus.
- **Voice Controls**: Mute, deafen, move, disconnect members.
- **Per-Guild Permissions**: All commands respect Discord's native permission system.

### 🤖 Custom Reddit Feeds
- **Multi-Platform Support**: Official support for **Epic Games Store**, **Steam**, **GOG.com**, **IndieGala**, **Humble Bundle**, **Itch.io**, **Ubisoft Store**, **EA App / Origin**, **Prime Gaming**, and **Battle.net**.
- **Automated Monday Drops**: Runs on an automated weekly schedule (every Monday) with an instant manual polling trigger in the dashboard.
- **Rich Store Embeds**: Standardized Discord embeds with official store branding, high-contrast badges, pricing worth, expiration timers, and direct claim links.

### 🤖 Custom Reddit Feeds
- **Subreddit & User Feeds**: Subscribe to any subreddit (e.g. `r/technology`, `r/wallpapers`, `r/EarthPorn`), user stream, or custom `.rss` URL.
- **Dual Display Modes**:
  - 🖼️ **Pure Image Mode**: Extracts full-resolution images and animated GIFs while stripping out message text bodies.
  - 📰 **Standard RSS Mode**: Formats complete message prose, author badges, and dedicated discussion link fields.
- **Animated GIF Prioritization**: Automatically resolves and displays direct `.gif` animations and Imgur `.gifv` media.
- **Interactive Mode Switcher**: Toggle any active Reddit feed between Image and RSS mode in one click.

### 📰 Curated News Feeds Catalog
- **700+ Verified Presets**: One-click subscription to top publications across Technology, Artificial Intelligence, Gaming, Science, Cybersecurity, Hardware, Apple, Linux, Programming, Finance, and Entertainment.
- **Organized Categories**: Clean category grouping with automated Discord channel routing.

### 🕷️ Custom CSS Webpage Scraper
- **Scrape Any Site Without RSS**: Turn any website, blog, or forum into an automated Discord feed using standard CSS selectors (`itemSelector`, `titleSelector`, `linkSelector`, `descriptionSelector`).
- **Relative URL Resolution**: Automatically expands relative links (`/posts/123`) to full canonical HTTP addresses.

### 🎨 Uniform Standardized Embeds
- **Single Shared Width**: Uniform card layout across all feeds and platforms.
- **Structured Fields**: Links, source attribution, and metadata are cleanly placed in dedicated embed fields rather than cluttered inline text.

### 🤖 Discord Bot Integration
- **Direct Channel Delivery**: Delivers directly to text channels via the Discord REST API—no webhook creation or management required.
- **Forum Thread Delivery** *(optional, per server)*: Each feed can deliver into its own dedicated thread inside a forum channel—threads are kept open via keepalive polling and rotate into a fresh thread when they grow large. Configured from the dashboard Feeds tab or `FORUM_CHANNEL_IDS` env.
- **Slash Commands**: Interactive commands grouped by category:
  - **Feeds**: `/feed` (add/remove/list/pause/resume), `/stats`
  - **Music**: `/play`, `/queue`, `/skip`, `/previous`, `/shuffle`, `/loop`, `/volume`, `/seek`, `/nowplaying`, `/pause`, `/resume`, `/stop`, `/leave`
  - **Entertainment**: `/gif`, `/slap`, `/hug`, `/kiss`, `/pat`, `/bonk`, `/cuddle`, `/tickle`, `/pet`, `/poke`, `/baka`, `/smug`, `/cry`, `/angry`, `/meme`
  - **Admin**: `/admin warn`, `/admin kick`, `/admin ban`, `/admin lock`, `/admin purge`, `/admin slowmode`, `/admin announce`, `/admin role`
  - **Utility**: `/about`, `/help`
- **Automatic Owner Detection**: Automatically grants full Owner rights to Discord Application owners and team members upon Discord login.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v22.9.0` or higher (uses native `node:sqlite`).
- **Discord Bot**: Application registered on the [Discord Developer Portal](https://discord.com/developers/applications).

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/HELIX-Origin/HELIX-Discord-Bot.git
cd HELIX-Discord-Bot

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment (`.env`)

Edit `.env` and enter your Discord Application credentials:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_application_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
INTERNAL_URL=127.0.0.1:3131
PUBLIC_URL=http://localhost:3131
REPO_URL=https://github.com/HELIX-Origin/HELIX-Discord-Bot
USER_AGENT=HELIX-Origin/HELIX-Discord-Bot
```

### 3. Build & Run

```bash
npm install
npm run build
npm start
```

Open **`http://localhost:3131`** in your browser and click **Log In with Discord**!

---

## 🐳 Docker & VPS Deployment

### Docker Compose

```yaml
services:
  helix-discord-bot:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - .:/app
      - ./data:/app/data
    ports:
      - "3131:3131"
    environment:
      - NODE_ENV=production
    command: sh -c "npm install && npm run build && npm start"
    restart: unless-stopped
```

### Linux systemd Service

Install HELIX Discord Bot as a managed 24/7 background systemd service:

```bash
sudo ./scripts/install-service.sh
```

---

## 📚 Extensive Wiki & Documentation

Comprehensive guides, architecture breakdowns, configuration settings, and API specifications are maintained in the project wiki:

| Wiki Page | Description |
|---|---|
| [🏠 Wiki Home](../../wiki/HOME) | Central documentation index and quick reference. |
| [🎁 Free Games Feeds](../../wiki/Free-Games-Feeds) | Supported platforms, weekly Monday cron, manual poll triggers, and embed schemas. |
| [🤖 Reddit Feeds](../../wiki/Reddit-Feeds) | Pure Image vs Standard RSS modes, animated GIFs, sort filters, and presets. |
| [📰 Feeds & Web Scraper](../../wiki/Feeds-and-Scrapers) | RSS/Atom parsing, CSS webpage scrapers, and the 700+ News Feeds catalog. |
| [🤖 Discord Bot & Commands](../../wiki/Discord-Bot) | Developer Portal configuration, slash commands, direct channel delivery, and embed styling. |
| [🎵 Music & Lavalink](../../wiki/Music) | Lavalink v4 playback (YouTube, Spotify, SoundCloud, Apple Music, Deezer), queue management, embedded node setup, and dashboard queue page. |
| [😂 Entertainment & GIF Commands](../../wiki/Entertainment) | KLIPY-powered `/gif` with autocomplete, action commands (`/slap`, `/hug`, etc.), and random GIF fallback. |
| [🛡️ Guild Administration](../../wiki/Administration) | Moderation (`/admin warn`, `/kick`, `/ban`, `/lock`, `/purge`, `/slowmode`, `/announce`), role management, voice controls, permission guards. |
| [🏗️ Architecture & Design](../../wiki/Architecture-and-Design) | SQLite schema, AppState in-memory caching, RedisCoordinator, and FeedWatcher engine. |
| [⚙️ Configuration Guide](../../wiki/Configuration) | Exhaustive reference for all `.env` environment variables and settings. |
| [🚀 Deployment & Hosting](../../wiki/Deployment-and-Hosting) | Docker, Docker Compose, VPS/PM2, systemd self-hosting, and native SSL. |
| [💻 Development & Testing](../../wiki/Development-and-Testing) | Developer environment setup, test runner commands, TypeScript checking, and code style standards. |
| [🔒 Integrations & Security](../../wiki/Integrations-and-Security) | Discord OAuth2, session cookies, RBAC permissions, and anti-bot challenge detection. |
| [📡 REST API Reference](../../wiki/API-Reference) | Complete documentation of all dashboard, feed, and management REST endpoints. |
| [🔧 Troubleshooting Playbook](../../wiki/Troubleshooting) | Step-by-step diagnostic guide for common configuration and network errors. |

---

## 🤝 Contributing

Contributions, feature suggestions, and bug reports are welcome!
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for code quality standards and git commit conventions.
- Report issues and request features on our [GitHub Issue Tracker](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues).

---

## 📄 License

This project is open source and available under the terms of the [MIT License](LICENSE.md).