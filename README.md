<div align="center">
  <img src=".github/assets/images/github-social-banner.jpg" width="100%" alt="HELIX Discord Bot Banner" />

  # 📡 HELIX Discord Bot
  **A modern, self-hosted RSS, Web Scraper, Reddit, & Free Games syndication hub for Discord.**

  <a href="https://github.com/HELIX-Origin/HELIX-Discord-Bot/releases"><img src="https://img.shields.io/github/package-json/v/HELIX-Origin/HELIX-Discord-Bot?style=flat-square&logo=github" height="20" alt="Version" /></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/license-BSD--3--Clause-blue?style=flat-square" height="20" alt="License" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FHELIX-Origin%2FHELIX-Discord-Bot%2Fmain%2Fpackage.json&query=engines.node&label=Node.js&logo=node.js&logoColor=white&color=339933&style=flat-square" height="20" alt="Node.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/github/languages/top/HELIX-Origin/HELIX-Discord-Bot?style=flat-square&logo=typescript&logoColor=white" height="20" alt="TypeScript" /></a>
  <br />
  <a href="https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues"><img src="https://img.shields.io/github/issues/HELIX-Origin/HELIX-Discord-Bot?style=flat-square" height="20" alt="Issues" /></a>
  <a href="https://github.com/HELIX-Origin/HELIX-Discord-Bot"><img src="https://img.shields.io/github/stars/HELIX-Origin/HELIX-Discord-Bot?style=flat-square&logo=github" height="20" alt="Stars" /></a>
  <a href="https://github.com/HELIX-Origin/HELIX-Discord-Bot/commits/main"><img src="https://img.shields.io/github/last-commit/HELIX-Origin/HELIX-Discord-Bot?style=flat-square" height="20" alt="Last Commit" /></a>
  <a href="https://discord.gg/Ww3XBZC2HV"><img src="https://dcbadge.limes.pink/api/server/https://discord.gg/Ww3XBZC2HV?style=flat-square" height="20" alt="Discord" /></a>
</div>

---

## 📖 Overview

**HELIX Discord Bot** is a lightweight, multi-user feed syndication engine and Discord bot built natively in TypeScript ESM. It monitors RSS/Atom feeds, custom CSS webpage scrapers, curated subreddit streams, and free game promotions — delivering clean, rich Discord embeds straight to your server channels with zero webhook setup.

It ships with a built-in web dashboard, Discord OAuth2 authentication, no frontend npm dependencies, SQLite persistence, and optional Redis clustering. For detailed information, see the [**Documentation**](https://helix-origin.github.io/HELIX-Discord-Bot/README.html).

Visit the project site at [**helix-origin.github.io/HELIX-Discord-Bot**](https://helix-origin.github.io/HELIX-Discord-Bot/), part of the [HELIX Origin GitHub Pages profile](https://helix-origin.github.io/).

---

## ✨ Features

| Feature | Details |
|:---|:---|
| 🎮 **Free Games Alerts** | Automated free-game giveaways from Epic Games, Steam, GOG, Humble, Itch.io, and more — with rich store embeds and deduplication. → [Docs](https://helix-origin.github.io/HELIX-Discord-Bot/Free-Games-Feeds.html) |
| 🤖 **Reddit Feeds** | Subreddit/user feeds with Pure Image & Standard RSS modes, animated GIF support, community home post filtering, and NSFW age-restriction enforcement. Needs a Reddit session cookie (`cookies.json`/`cookies.txt`). → [Docs](https://helix-origin.github.io/HELIX-Discord-Bot/Reddit-Feeds.html) |
| 📰 **RSS, Web Scrapers & News Catalog** | RSS/Atom/JSON feeds, CSS-selector scrapers for sites without RSS, and a 700+ preset news catalog. Features single-newest-post delivery and rate-limit shield. → [Docs](https://helix-origin.github.io/HELIX-Discord-Bot/Feeds-and-Scrapers.html) |
| 📢 **Stream Alerts** | YouTube & Twitch live/upload alerts delivered via webhooks with polling fallback. → [Docs](https://helix-origin.github.io/HELIX-Discord-Bot/Feeds-and-Scrapers.html) |
| 🛡️ **Guild Administration** | Moderation (`/warn`, `/kick`, `/ban`, `/purge`, ...), role management, voice controls, and server settings. → [Docs](https://helix-origin.github.io/HELIX-Discord-Bot/Administration.html) |
| 👋 **Welcome System** | Customizable welcome announcements for new arrivals (`/welcome` & dashboard) with placeholders (`{user}`, `{mention}`, `{server}`, `{membercount}`), plain text or embed format, and live Discord preview. → [Docs](https://helix-origin.github.io/HELIX-Discord-Bot/Administration.html) |
| 🎫 **Ticket System** | Text-channel button prompt (`/ticket` & dashboard) that creates dedicated threads upon user interaction with support manager role pings and live button preview. → [Docs](https://helix-origin.github.io/HELIX-Discord-Bot/Administration.html) |
| 🧵 **Thread Delivery** | Deliver each feed into its own dedicated thread auto-created in the feed's channel with auto-subscription. → [Docs](https://helix-origin.github.io/HELIX-Discord-Bot/Discord-Bot.html) |
| 🖥️ **Web Dashboard** | Built-in management dashboard with Discord OAuth2, Light/Dark themes, responsive window-fitting layouts, live Discord previews, and per-guild configuration. → [Docs](https://helix-origin.github.io/HELIX-Discord-Bot/Architecture-and-Design.html) |

Feature flags (`FEEDS_ENABLED`, `STREAM_ALERTS_ENABLED`, `DASHBOARD_ENABLED`, etc.) toggle each subsystem. → [Configuration](https://helix-origin.github.io/HELIX-Discord-Bot/Configuration.html)

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

For Docker Compose, Linux systemd/VPS, or Cloud PaaS deployment, see [🚀 Deployment & Hosting](https://helix-origin.github.io/HELIX-Discord-Bot/Deployment-and-Hosting.html).

---

## 📚 Documentation

Comprehensive guides, configuration references, architecture breakdowns, and API documentation live in the [documentation portal](https://helix-origin.github.io/HELIX-Discord-Bot/README.html):

| Documentation Page | Description |
|---|---|
| [🏠 Documentation Home](https://helix-origin.github.io/HELIX-Discord-Bot/README.html) | Central documentation index and quick reference. |
| [🎁 Free Games Feeds](https://helix-origin.github.io/HELIX-Discord-Bot/Free-Games-Feeds.html) | Supported platforms, polling schedule, and embed schemas. |
| [🤖 Reddit Feeds](https://helix-origin.github.io/HELIX-Discord-Bot/Reddit-Feeds.html) | Image vs RSS modes, animated GIFs, session cookies, NSFW enforcement. |
| [📰 Feeds & Web Scraper](https://helix-origin.github.io/HELIX-Discord-Bot/Feeds-and-Scrapers.html) | RSS/Atom parsing, CSS scrapers, and the news catalog. |
| [🤖 Discord Bot & Commands](https://helix-origin.github.io/HELIX-Discord-Bot/Discord-Bot.html) | Developer Portal setup, slash commands, delivery, embed styling. |
| [🛡️ Guild Administration](https://helix-origin.github.io/HELIX-Discord-Bot/Administration.html) | Moderation, roles, voice controls, permission guards. |
| [🏗️ Architecture & Design](https://helix-origin.github.io/HELIX-Discord-Bot/Architecture-and-Design.html) | SQLite schema, AppState caching, RedisCoordinator, FeedWatcher. |
| [⚙️ Configuration Guide](https://helix-origin.github.io/HELIX-Discord-Bot/Configuration.html) | Exhaustive reference for all `.env` variables. |
| [🚀 Deployment & Hosting](https://helix-origin.github.io/HELIX-Discord-Bot/Deployment-and-Hosting.html) | Docker, VPS/systemd, and manual Cloud PaaS. |
| [💻 Development & Testing](https://helix-origin.github.io/HELIX-Discord-Bot/Development-and-Testing.html) | Developer setup, test runner, TypeScript checks, code style. |
| [🔒 Integrations & Security](https://helix-origin.github.io/HELIX-Discord-Bot/Integrations-and-Security.html) | Discord OAuth2, session cookies, RBAC permissions. |
| [📡 REST API Reference](https://helix-origin.github.io/HELIX-Discord-Bot/API-Reference.html) | Complete dashboard & feed REST endpoint documentation. |
| [🔧 Troubleshooting Playbook](https://helix-origin.github.io/HELIX-Discord-Bot/Troubleshooting.html) | Diagnostic guide for common configuration/network errors. |

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