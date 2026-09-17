# Rule 02: TypeScript Source Conventions & Architecture

## Project
**HELIX Discord Bot** — native TypeScript ESM, Node.js `>=22.9`. Minimal runtime dependencies; `node --env-file-if-exists=.env` for local configuration loading.

---

## Mandatory Source Layout

```text
src/
├── app.ts                          # AppDeps interface & core dependency wiring
├── config.ts                       # AppConfig schema & environment variable parsing
├── index.ts                        # Application bootstrap entry point
├── bot/                            # Discord Bot subsystem (discord.js v14)
│   ├── bot.ts                      # DiscordBot client wrapper (Gateway & lifecycle)
│   ├── rest.ts                     # DiscordRestClient (REST API client)
│   ├── commands/                   # Slash command implementations (categorized)
│   │   ├── admin/                  # /admin subcommands, /set, /ticket, /welcome
│   │   ├── entertainment/          # /gif, /slap, /hug, and action reaction commands
│   │   ├── feeds/                  # /feed syndication commands
│   │   ├── music/                  # /play, /skip, /queue, /volume, /filters, etc.
│   │   └── utility/                # /about, /stats, /ping, /help
│   ├── events/                     # Client event handlers (one file per event)
│   ├── handlers/                   # Command & event registries / dispatchers
│   ├── lib/                        # Discord UI libraries (EmbedHandler, limits, variants)
│   ├── music/                      # LavalinkManager & voice gateway integration
│   └── utils/                      # Discord API types & embed helpers
├── dashboard/                      # Integrated Web Management Dashboard
│   ├── server.ts                   # Native Node.js HTTP/HTTPS server
│   ├── auth/                       # Password hashing & user auth service
│   ├── http/                       # Router, request helpers, static asset handlers
│   ├── oauth/                      # Discord OAuth service & callback logic
│   ├── routes/                     # REST API route controllers
│   ├── views/                      # SSR view templates (Dashboard, Landing, Legal, Admin)
│   └── webhooks/                   # Webhook receiver router (YouTube/Twitch)
├── db/                             # Persistence layer
│   ├── database.ts                 # Native node:sqlite wrapper
│   ├── schema.ts                   # DDL migrations & indices
│   ├── repository.ts               # Unified write-through repository interface
│   └── repositories/               # Entity-specific repository delegates
├── feed/                           # Feed syndication subsystem
│   ├── fetch.ts                    # HTTP fetch with challenge detection
│   ├── parser.ts                   # RSS/Atom XML feed parsing & normalization
│   ├── freegames.ts                # Weekly free games aggregator (Epic + GamerPower)
│   ├── scraper.ts                  # Selector-based HTML scraping
│   ├── targets.ts                  # Channel/forum target resolution
│   ├── threads.ts                  # Forum thread manager (single thread per feed)
│   └── watcher.ts                  # FeedWatcher polling engine
├── scheduler/
│   └── scheduler.ts                # Non-overlapping interval timer scheduler
├── state/
│   ├── types.ts                    # Canonical data interfaces & row mappers
│   ├── app-state.ts                # In-memory write-through primary state store
│   └── redis.ts                    # In-memory / mock coordinator (locks & dedupe)
└── util/
    └── logger.ts                   # Structured leveled console logger
```

---

## Mandatory TypeScript Invariants

1. **Strict ESM & Import Extensions**:
   - All relative imports must include the explicit `.js` extension (e.g., `import { foo } from './bar.js';`).
   - Package is defined with `"type": "module"` in `package.json`.

2. **Strict Type Checking**:
   - Compiles with zero errors under `tsc --noEmit` (`npm run typecheck`).
   - `noImplicitAny: true`, `strict: true` must be satisfied.
   - Avoid `any`. Use unknown, generics, or defined interfaces in `src/state/types.ts` or `src/bot/utils/types.js`.

3. **Type-Only Imports**:
   - Use `import type { ... }` when importing interfaces or type definitions to prevent runtime overhead and circular import issues.

4. **No Circular Dependencies**:
   - Subsystems must adhere to a clean layered architecture:
     - `state/` and `db/` do NOT depend on `bot/` or `dashboard/`.
     - `bot/` and `dashboard/` depend on `state/`, `db/`, and `config.ts` via `AppDeps` in `app.ts`.

5. **In-Memory Primary Layer (`AppState`)**:
   - All reads are served from in-memory `AppState` Maps/Sets.
   - All writes go through `Repository`, which updates SQLite and writes through to `AppState`.