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
  <a href="https://heroku.com/deploy?template=https://github.com/HELIX-Origin/HELIX-Discord-Bot"><img src="https://img.shields.io/badge/Deploy%20to-Heroku-6762a6?style=plastic&logo=heroku&logoColor=white" alt="Deploy to Heroku"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.0.0-339933?style=plastic&logo=node.js&logoColor=white" alt="Node.js Version">
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-BSD_3--Clause-blue.svg?style=plastic" alt="License: BSD 3-Clause"></a>
</p>

**HELIX** is a Discord bot for developer communities -- moderation, thread-based ticketing, project scaffolding, and a GitHub-hosted language plugin system for code intelligence with no paid API dependencies.

---

## ⚡ 1-Click Cloud Deployment

Deploy HELIX Discord Bot instantly to your cloud platform of choice:

| Platform | Free Tier | Deploy Button |
|---|---|---|
| **Render** | **100% Free Web Service** | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/HELIX-Origin/HELIX-Discord-Bot) |
| **Koyeb** | **100% Free Nano Instance** | [![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?type=git&repository=github.com/HELIX-Origin/HELIX-Discord-Bot&branch=main&builder=dockerfile&env[DISCORD_TOKEN]=&env[DISCORD_CLIENT_ID]=&env[DISCORD_CLIENT_SECRET]=&env[NEXTAUTH_SECRET]=&env[NODE_ENV]=production&ports=5000;http;/&instance_type=free) |
| **Heroku** | **Eco Dyno ($5/mo pool)** | [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/HELIX-Origin/HELIX-Discord-Bot) |

---

## Quick Start (Local)

```bash
npm install
cp .env.example .env
npm start
```

Fill in `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `NEXTAUTH_SECRET` in `.env`. Everything else is optional or auto-resolved. The web dashboard runs at `http://localhost:5000/dashboard`.

---

## Documentation

- [Bot Reference](docs/discord-bot.md) -- commands, database, configuration
- [Web Dashboard](docs/web-dashboard.md) -- admin panel and OAuth2 flow
- [Language Plugins](docs/plugin-system.md) -- code intelligence plugin architecture
- [Plugin Authoring](docs/plugin-authoring.md) -- build and distribute custom language plugins
- [Plugin Repo Structure](docs/plugin-repository-structure.md) -- file layout, JSON schemas & TypeScript contracts
- [Scaffolding Templates](docs/scaffolding-templates.md) -- 17 project starters
- [Render Deployment (Free)](docs/deployment-render.md) -- 1-click free web service
- [Koyeb Deployment (Free)](docs/deployment-koyeb.md) -- 1-click free nano container
- [Heroku Deployment](docs/deployment-heroku.md) -- Eco dyno container guide
- [Docker / Self-Hosting](docs/deployment-docker.md) -- containerized setup

---

## License

Released under the [BSD 3-Clause License](LICENSE.md). Copyright (c) 2026 HELIX Team & Contributors.

**GitHub**: https://github.com/HELIX-Origin/HELIX-Discord-Bot  **Discord**: https://discord.gg/Ww3XBZC2HV
