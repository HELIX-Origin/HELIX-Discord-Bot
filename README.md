<div align="center">
  <img src=".github/assets/images/github-social-banner.jpg" width="100%" alt="HELIX Discord Bot Banner" />

  # 📡 HELIX Discord Bot
  **A modern, self-hosted RSS, Web Scraper, Reddit, & Free Games syndication hub for Discord.**

  [![Version](https://img.shields.io/github/package-json/v/HELIX-Origin/HELIX-Discord-Bot?style=flat-square&logo=github)](https://github.com/HELIX-Origin/HELIX-Discord-Bot/releases)
  [![License](https://img.shields.io/github/license/HELIX-Origin/HELIX-Discord-Bot?style=flat-square)](LICENSE)
  [![Node.js](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FHELIX-Origin%2FHELIX-Discord-Bot%2Fmain%2Fpackage.json&query=engines.node&label=Node.js&logo=node.js&logoColor=white&color=339933&style=flat-square)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/github/languages/top/HELIX-Origin/HELIX-Discord-Bot?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  <br />
  [![Issues](https://img.shields.io/github/issues/HELIX-Origin/HELIX-Discord-Bot?style=flat-square)](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues)
  [![Stars](https://img.shields.io/github/stars/HELIX-Origin/HELIX-Discord-Bot?style=flat-square&logo=github)](https://github.com/HELIX-Origin/HELIX-Discord-Bot)
  [![Last Commit](https://img.shields.io/github/last-commit/HELIX-Origin/HELIX-Discord-Bot?style=flat-square)](https://github.com/HELIX-Origin/HELIX-Discord-Bot/commits/main)
  [![Discord](https://dcbadge.limes.pink/api/server/https://discord.gg/Ww3XBZC2HV?style=flat-square)](https://discord.gg/Ww3XBZC2HV)
</div>

---

## 📖 Overview

**HELIX Discord Bot** is a lightweight, multi-user feed syndication engine and Discord bot built natively in TypeScript ESM. It monitors RSS/Atom feeds, custom CSS webpage scrapers, curated subreddit streams, and free game promotions — delivering clean, rich Discord embeds straight to your server channels with zero webhook setup.

It ships with a built-in web dashboard, Discord OAuth2 authentication, no frontend npm dependencies, SQLite persistence, and optional Redis clustering. For detailed information, see the [**Project Wiki**](../../wiki/HOME).

---

## ✨ Features

| Feature | Details |
|:---|:---|
| 🎮 **Free Games Alerts** | Automated free-game giveaways from Epic Games, Steam, GOG, Humble, Itch.io, and more — with rich store embeds and deduplication. → [Wiki](../../wiki/Free-Games-Feeds) |
| 🤖 **Reddit Feeds** | Subreddit/user feeds with Pure Image & Standard RSS modes, animated GIF support, and NSFW age-restriction enforcement. Needs a Reddit session cookie (`cookies.json`/`cookies.txt`). → [Wiki](../../wiki/Reddit-Feeds) |
| 📰 **RSS, Web Scrapers & News Catalog** | RSS/Atom/JSON feeds, CSS-selector scrapers for sites without RSS, and a 700+ preset news catalog. → [Wiki](../../wiki/Feeds-and-Scrapers) |
| 📢 **Stream Alerts** | YouTube & Twitch live/upload alerts delivered via webhooks with polling fallback. → [Wiki](../../wiki/Feeds-and-Scrapers) |
| 🛡️ **Guild Administration** | Moderation (`/warn`, `/kick`, `/ban`, `/purge`, ...), role management, and voice controls. → [Wiki](../../wiki/Administration) |
| 🧵 **Thread Delivery** | Deliver each feed into its own dedicated thread auto-created in the feed's channel. → [Wiki](../../wiki/Discord-Bot) |
| 🖥️ **Web Dashboard** | Built-in management dashboard with Discord OAuth2, Light/Dark themes, and per-guild feed configuration. → [Wiki](../../wiki/Architecture-and-Design) |

Feature flags (`FEEDS_ENABLED`, `STREAM_ALERTS_ENABLED`, `DASHBOARD_ENABLED`, etc.) toggle each subsystem. → [Wiki: Configuration](../../wiki/Configuration)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v22.9.0` or higher (uses native `node:sqlite`).
- **Discord Bot**: Application registered on the [Discord Developer Portal](https://discord.com/developers/applications).

### 1. Clone & Setup

```bash
git clone https://github.com/HELIX-Origin/HELIX-Discord-Bot.git
cd HELIX-Discord-Bot
cp .env.example .env
```

### 2. Configure Environment (`.env`)

Enter your Discord Application credentials:

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

For Docker Compose, Linux systemd/VPS, or Cloud PaaS deployment, see [🚀 Deployment & Hosting](../../wiki/Deployment-and-Hosting).

---

## 📚 Extensive Wiki & Documentation

Comprehensive guides, configuration references, architecture breakdowns, and API documentation live in the [project wiki](../../wiki/HOME):

| Wiki Page | Description |
|---|---|
| [🏠 Wiki Home](../../wiki/HOME) | Central documentation index and quick reference. |
| [🎁 Free Games Feeds](../../wiki/Free-Games-Feeds) | Supported platforms, polling schedule, and embed schemas. |
| [🤖 Reddit Feeds](../../wiki/Reddit-Feeds) | Image vs RSS modes, animated GIFs, session cookies, NSFW enforcement. |
| [📰 Feeds & Web Scraper](../../wiki/Feeds-and-Scrapers) | RSS/Atom parsing, CSS scrapers, and the news catalog. |
| [🤖 Discord Bot & Commands](../../wiki/Discord-Bot) | Developer Portal setup, slash commands, delivery, embed styling. |
| [🛡️ Guild Administration](../../wiki/Administration) | Moderation, roles, voice controls, permission guards. |
| [🏗️ Architecture & Design](../../wiki/Architecture-and-Design) | SQLite schema, AppState caching, RedisCoordinator, FeedWatcher. |
| [⚙️ Configuration Guide](../../wiki/Configuration) | Exhaustive reference for all `.env` variables. |
| [🚀 Deployment & Hosting](../../wiki/Deployment-and-Hosting) | Docker, VPS/systemd, and manual Cloud PaaS. |
| [💻 Development & Testing](../../wiki/Development-and-Testing) | Developer setup, test runner, TypeScript checks, code style. |
| [🔒 Integrations & Security](../../wiki/Integrations-and-Security) | Discord OAuth2, session cookies, RBAC permissions. |
| [📡 REST API Reference](../../wiki/API-Reference) | Complete dashboard & feed REST endpoint documentation. |
| [🔧 Troubleshooting Playbook](../../wiki/Troubleshooting) | Diagnostic guide for common configuration/network errors. |

---

## 🤝 Contributing & Policies

Contributions, feature suggestions, and bug reports are welcome!
- Review [CONTRIBUTING](CONTRIBUTING.md) for code quality standards and git commit conventions.
- Report issues and request features on our [GitHub Issue Tracker](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues).
- Review our [Security Policy](SECURITY.md) for vulnerability reporting.
- Review our [Privacy Policy](PRIVACY.md) and [Terms of Service](TOS.md).

---

## 📄 License

This project is open source and available under the terms of the [BSD 3-Clause License](LICENSE).