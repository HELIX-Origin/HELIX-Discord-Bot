<p align="center">
  <img src=".github/assets/images/icon.jpg" alt="HELIX Icon" width="128" height="128">
</p>

<h1 align="center">HELIX</h1>

<p align="center">
  <b>Standalone Discord Bot — Developer Community Assistant</b>
</p>

<p align="center">
  <a href="https://github.com/HELIX-Origin/HELIX/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/HELIX-Origin/HELIX/ci.yml?branch=main&label=CI&style=plastic&logo=github" alt="CI Status"></a>
  <a href="https://discord.gg/Ww3XBZC2HV"><img src="https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=plastic&logo=discord&logoColor=white" alt="Discord Server"></a>
  <a href="https://heroku.com/deploy?template=https://github.com/HELIX-Origin/HELIX&env[DISCORD_TOKEN]=&env[DISCORD_CLIENT_ID]=&env[DISCORD_CLIENT_SECRET]=&env[PORT]=5000&env[NEXTAUTH_URL]=&env[NEXTAUTH_INTERNAL_URL]=http://localhost&env[NEXTAUTH_SECRET]=&env[DISCORD_CALLBACK_URL]=http://localhost:5000"><img src="https://img.shields.io/badge/Deploy%20to-Heroku-6762a6?style=plastic&logo=heroku&logoColor=white" alt="Deploy to Heroku"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.0.0-339933?style=plastic&logo=node.js&logoColor=white" alt="Node.js Version">
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-BSD_3--Clause-blue.svg?style=plastic" alt="License: BSD 3-Clause"></a>
</p>

**HELIX** is a standalone Discord bot for developer communities, providing code intelligence via language plugins, moderation tools, and thread-based support ticketing. The bot is self-contained in `HELIX/src/` using vanilla discord.js (TypeScript) with no AI API dependencies.

---

## Core Features

- **Code Intelligence via Language Plugins**: Linting, explanation, and documentation cross-referencing using built-in linters — no paid APIs required
- **13 Built-in Language Plugins**: TypeScript, JavaScript, Python, C#, GDScript, Rust, Go, Java, PHP, SQL, HTML/CSS, Flutter/Dart, Lua
- **Developer Moderation**: Kick, ban, unban, timeout, untimeout, purge, warn
- **Support Ticketing**: Thread-based tickets with setup, close, transcript export
- **Guild Configuration**: Per-guild prefix (`>` default), tickets-hub, mod-log-channel, welcome-channel
- **Self-Contained**: SQLite database with autonomous schema creation and migrations
- **Auto-Resolved URLs**: NEXTAUTH_URL and DISCORD_CALLBACK_URL auto-detected from platform env vars (Heroku, Render, Railway, custom domain)
- **Only `PORT` needed for local development**: Public URLs auto-detected on deployment platforms

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy example environment file
cp .env.example .env

# Launch the bot
npm start
```

Only `PORT` is required in `.env` for local development. All other URL environment variables are auto-resolved on deployment platforms.

---

## Commands

### Prefix Commands (`>`)
Every command is a prefix command by default. The bot registers all commands as prefix commands, and guild owners may optionally register desired command groups as slash commands in their guild.

- `>help` - Display all available commands
- `>status` - Report system health
- `>ping` - Check WebSocket latency
- `>avatar [user]` - Get user avatar
- `>serverinfo` - Server information
- `>userinfo [user]` - User information
- `>plugin list` - List installed language plugins
- `>plugin install <owner/repo>` - Install plugin from GitHub
- `>plugin remove <id>` - Remove installed plugin
- `>plugin info <id>` - Show plugin details
- `>plugin enable <id>` / `>plugin disable <id>` - Enable/disable plugin
- `>set prefix <char>` - Change server prefix
- `>set tickets-hub <channel>` - Set ticket hub channel
- `>ticket create [subject]` - Create support ticket
- `>ticket close` - Close current ticket

### Slash Commands (`/`)
Guild owners may optionally register specific command groups as slash commands via the guild's slash command registry. These are the same commands available as prefix commands, registered as slash commands for that guild.

- `/lint` - Analyze code for errors (registered per-guild)
- `/explain` - Explain code using documentation (registered per-guild)
- `/docs` - Look up official documentation (registered per-guild)
- `/plugin` - Manage language plugins (registered per-guild)

---

## Architecture

- **Vanilla discord.js**: Plain `new Client()` with `GatewayIntentBits` — no decorator frameworks
- **CommandDefinition interface**: Unified type with `execute(context)` handling both prefix and slash
- **No index files**: Only entry points (`index.ts`) at root, `src/`, and `dashboard/`
- **Named exports only**: All command and event files use named exports
- **Handler-based discovery**: Auto-discovers via `import.meta.glob`
- **Language Plugin System**: Plugin repos read `config.json` manifest, load individual `plugin.json` manifests
- **Database**: SQLite with `node:sqlite` `DatabaseSync`, autonomous migrations on startup
- **Optional slash command registry**: Guild owners register desired command groups as slash commands; all commands remain available as prefix commands

---

## Plugin System

Both built-in (`helix-origin`) and community plugin repos use identical structure:

```
my-plugin-repo/
├── config.json          # Repo-level manifest (entry point)
├── typescript/          # Plugin folder
│   ├── plugin.json      # Individual plugin manifest
│   ├── linter.ts        # Linter implementation
│   ├── patterns.ts      # Common patterns & anti-patterns
│   ├── docs-cache.ts    # Cached official doc references
│   └── examples/        # Code examples by topic
└── python/              # Same structure for other languages
```

- `config.json`: Lists all plugins in the repo with `id` and `path`
- `plugin.json`: Individual plugin manifest with `id`, `name`, `version`, `fileExtensions`, `capabilities`, `entry`
- Bot reads repo config first, then loads each plugin's manifest and entry point

Only `PORT` env var needed for local development. Public URLs auto-detected on Heroku/Render/Railway/custom domains.

---

## Documentation

Explore the documentation suite:

- [Discord Bot Architecture](docs/discord-bot.md)
- [Web Dashboard Guide](docs/web-dashboard.md)
- [Deployment Guides](docs/deployment-heroku.md), [docs/deployment-docker.md]
- [Plugin System Design](docs/plugin-system.md)

---

## License

Released under the [BSD 3-Clause License](LICENSE.md). Copyright © 2026 HELIX Team & Contributors.

---

## Links

- **GitHub**: https://github.com/HELIX-Origin/HELIX
- **Discord Community**: https://discord.gg/Ww3XBZC2HV
- **Documentation**: [docs/index.md](docs/index.md)