<p align="center">
  <img src=".github/assets/images/icon.jpg" alt="HELIX Icon" width="128" height="128">
</p>

<h1 align="center">HELIX</h1>

<p align="center">
  <b>Standalone Discord Bot -- Developer Community Assistant</b>
</p>

<p align="center">
  <a href="https://github.com/HELIX-Origin/HELIX/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/HELIX-Origin/HELIX/ci.yml?branch=main&label=CI&style=plastic&logo=github" alt="CI Status"></a>
  <a href="https://discord.gg/Ww3XBZC2HV"><img src="https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=plastic&logo=discord&logoColor=white" alt="Discord Server"></a>
  <a href="docs/deployment-heroku.md"><img src="https://img.shields.io/badge/Deploy%20to-Heroku-6762a6?style=plastic&logo=heroku&logoColor=white" alt="Deploy to Heroku"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.0.0-339933?style=plastic&logo=node.js&logoColor=white" alt="Node.js Version">
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-BSD_3--Clause-blue.svg?style=plastic" alt="License: BSD 3-Clause"></a>
</p>

**HELIX** is a Discord bot for developer communities -- moderation, thread-based ticketing, project scaffolding, and a GitHub-hosted language plugin system for code intelligence with no paid API dependencies.

---

## Quick Start

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
- [Scaffolding Templates](docs/scaffolding-templates.md) -- 17 project starters
- [Heroku Deployment](docs/deployment-heroku.md) -- deploy guide
- [Docker / Self-Hosting](docs/deployment-docker.md) -- containerized setup

---

## License

Released under the [BSD 3-Clause License](LICENSE.md). Copyright (c) 2026 HELIX Team & Contributors.

**GitHub**: https://github.com/HELIX-Origin/HELIX  **Discord**: https://discord.gg/Ww3XBZC2HV
