<p align="center">
  <img src=".github/assets/images/icon.jpg" alt="HELIX Icon" width="128" height="128">
</p>

<h1 align="center">HELIX Discord Bot</h1>

<p align="center">
  <b>Standalone Discord Bot -- Developer Community Assistant</b>
</p>

<p align="center">
  <a href="https://github.com/HELIX-Origin/HELIX-Discord-Bot/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/HELIX-Origin/HELIX-Discord-Bot/ci.yml?branch=main&label=CI&style=plastic&logo=github" alt="CI Status"></a>
  <a href="https://discord.gg/Ww3XBZC2HV"><img src="https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=plastic&logo=discord&logoColor=white" alt="Discord Server"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.0.0-339933?style=plastic&logo=node.js&logoColor=white" alt="Node.js Version">
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-BSD_3--Clause-blue.svg?style=plastic" alt="License: BSD 3-Clause"></a>
</p>

**HELIX** is a standalone Discord bot and web dashboard for developer communities — moderation, thread-based ticketing, multi-framework project scaffolding, and a GitHub-hosted language plugin system for code intelligence with zero paid external AI API dependencies.

---

## Quick Start

```bash
# Clone repository and install dependencies
git clone https://github.com/HELIX-Origin/HELIX-Discord-Bot.git
cd HELIX-Discord-Bot
npm ci
npm --prefix HELIX ci

# Configure environment
cp .env.example .env

# Build and start
npm run build
npm start
```

Configure your Discord credentials in `.env`:
- `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `NEXTAUTH_SECRET`.
- Optional: Set `NEXTAUTH_URL=https://yourdomain.com` for public web dashboard access.

The companion dashboard runs at `http://localhost:5000/dashboard`.

---

## Documentation

- [Self-Hosting & Deployment Guide](docs/self-hosting.md) -- complete setup on VPS, Linux, PM2, systemd, and Nginx/SSL
- [Bot Reference](docs/discord-bot.md) -- commands, database, configuration
- [Web Dashboard](docs/web-dashboard.md) -- admin panel and OAuth2 flow
- [Language Plugins](docs/plugin-system.md) -- code intelligence plugin architecture
- [Plugin Authoring](docs/plugin-authoring.md) -- build and distribute custom language plugins
- [Plugin Repo Structure](docs/plugin-repository-structure.md) -- file layout, JSON schemas & TypeScript contracts
- [Scaffolding Templates](docs/scaffolding-templates.md) -- 17 project starters

---

## License

Released under the [BSD 3-Clause License](LICENSE.md). Copyright (c) 2026 HELIX Team & Contributors.

**GitHub**: https://github.com/HELIX-Origin/HELIX-Discord-Bot  **Discord**: https://discord.gg/Ww3XBZC2HV
