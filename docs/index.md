# HELIX Documentation

| Doc | Description |
|-----|-------------|
| [Bot Reference](discord-bot.md) | Full command reference, DB schema, environment variables |
| [Web Dashboard](web-dashboard.md) | Dashboard endpoints, OAuth2 flow, bot connection |
| [Language Plugins](plugin-system.md) | Plugin architecture, manifest spec, built-in plugin list |
| [Plugin Authoring](plugin-authoring.md) | How to build, test, and publish custom language plugins & source providers |
| [Plugin Repo Structure](plugin-repository-structure.md) | Detailed file layout, JSON schemas, capability matrix & TypeScript contracts |
| [Scaffolding Templates](scaffolding-templates.md) | All 17 supported project templates |
| [Heroku Deployment](deployment-heroku.md) | 1-click free-tier deploy |
| [Docker / Self-Hosting](deployment-docker.md) | Containerized self-hosted setup |

---

## Source Layout

```
HELIX/
├── index.ts              # Entry point — wires bot + HTTP server
├── src/
│   ├── client.ts         # discord.js Client factory & HelixBotClient wrapper
│   ├── server.ts         # OAuth2 callback + dashboard HTTP server
│   ├── env.ts            # Typed env accessors with platform URL auto-detection
│   ├── config.ts         # Internal constants (limits, colors, feature flags)
│   ├── commands/
│   │   ├── mod/          # kick, ban, unban, timeout, untimeout, purge, warn
│   │   ├── util/         # ping, avatar, serverinfo, userinfo, poll, snowflake, remind
│   │   ├── info/         # help, info, status, list
│   │   ├── project/      # create, scaffold
│   │   └── config/       # set, ticket, plugin
│   ├── handlers/         # command, slash, event, help-registrar, logs, message-handler, errors
│   ├── events/           # ready, guild-create, guild-delete, interaction-create, message-create
│   ├── interactions/     # tickets.ts — button/modal handlers
│   ├── plugins/          # types, manifest, plugin-loader, registry, repo-config
│   ├── scaffolding/      # template-engine, file-generator, generators/
│   ├── db/               # database.ts — SQLite singleton & schema migrations
│   └── messages.json     # Central formatting schema for embeds, responses, logs, errors
└── dashboard/            # HTTP router, API handlers, UI
