# Rule 06: Discord.js Standards & Modular Command Architecture

**Status**: MANDATORY COMPLIANCE  
**Target Runtime**: `discord.js` v14 (Node.js `>=22.9`, TypeScript ESM)  
**Upstream Reference**: [discordjs.guide](https://discordjs.guide) | [discord.js Docs](https://discord.js.org/docs)

---

## 1. Architectural Philosophy: Self-Contained Commands & Modular Lib

To guarantee maximum readability, maintainability, and clean domain isolation:
1. **Self-Contained Commands**: Subcommands and options MUST be colocated directly within their respective command files (`src/bot/commands/<category>/<command>.ts`). This keeps the schema, option choices, autocomplete definitions, and execution logic together.
2. **Dedicated Lib Directory (`src/bot/lib/`)**: The `lib/` directory is reserved exclusively for reusable libraries, modules, and utilities (such as `embeds/`, `music/`, `admin/`, `feeds/`, and common helpers) used by **both commands and events**.
3. **Dynamic Methods Over Hardcoding**: Prefer dynamic registration, automated discovery, dynamic option generation, and registry queries over rigid static mappings and hardcoded command lists.

### Discord API Limits (Hard Invariants)
| Metric | Discord API Limit | Architectural Guardrail |
|---|---|---|
| **Global Slash Commands** | 100 maximum | Modular registry with dynamic feature flag filtering (`getEnabledCommands`) |
| **Options per Command/Subcommand** | 25 maximum | Flat actions or subcommands; defined within the command file |
| **Choices per Option** | 25 maximum | Auto-truncated or curated choice sets (`choices.slice(0, 25)`) |
| **Command Definition Total Size** | 4,000 characters combined | Lean descriptions, concise option text |
| **Command Name Length** | 1–32 characters | Lowercase alphanumeric only (`^[a-z0-9_-]{1,32}$`) |
| **Command Description Length** | 1–100 characters | Concise summary of command purpose |
| **Option Name Length** | 1–32 characters | Lowercase alphanumeric only |
| **Option Description Length** | 1–100 characters | Clear, user-facing parameter prompt |
| **Autocomplete Results** | 25 choices maximum | Dynamic search & return `results.slice(0, 25)` |
| **Embeds per Message** | 10 maximum | Single primary embed standard; multiple only when syndicating batches |
| **Embed Title Length** | 256 characters | Auto-clamped by `EmbedHandler` |
| **Embed Description Length** | 4,096 characters | Auto-clamped by `EmbedHandler` (soft cap 350 for responses) |
| **Embed Fields** | 25 maximum | Auto-sliced by `EmbedHandler` |
| **Embed Field Name** | 256 characters | Clamped by `EmbedHandler` |
| **Embed Field Value** | 1,024 characters | Clamped by `EmbedHandler` |
| **Total Embed Characters** | 6,000 combined | Clamped across all embed components |

---

## 2. Directory Structure: `src/bot/` & `src/bot/lib/`

Command execution code, event handlers, and shared libraries follow this strict separation of concerns:

```text
src/bot/
├── bot.ts                          # DiscordBot class (Client lifecycle, Gateway, voice state)
├── rest.ts                         # DiscordRestClient (REST API client, direct Discord HTTP)
├── commands/                       # Slash commands with colocated options & subcommands
│   ├── admin/                      # Moderation, roles, channels, tickets, welcome
│   │   ├── set.ts                  # /set (options and subcommands defined in-file)
│   │   ├── ticket.ts               # /ticket
│   │   └── welcome.ts              # /welcome
│   ├── entertainment/              # Reaction GIFs and action commands
│   │   └── gif.ts                  # /gif search & action commands
│   ├── feeds/                      # RSS/Atom/Reddit/Free Games commands
│   │   └── feed.ts                 # /feed (actions and options defined in-file)
│   ├── music/                      # Music playback commands (one file per command)
│   │   ├── play.ts                 # /play
│   │   ├── pause.ts                # /pause
│   │   ├── skip.ts                 # /skip
│   │   ├── queue.ts                # /queue
│   │   ├── volume.ts               # /volume
│   │   └── ...                     # Individual music commands
│   ├── utility/                    # System & informational commands
│   │   ├── about.ts                # /about
│   │   ├── help.ts                 # /help
│   │   ├── info.ts                 # /info
│   │   └── stats.ts                # /stats
│   └── registry.ts                 # Dynamic ApplicationCommand[] assembly & feature filtering
├── events/                         # Client event handlers (one file per Discord event)
│   ├── ready.ts                    # 'ready' (once) - uses lib/ for startup notifications
│   ├── interactionCreate.ts        # 'interactionCreate' (slash, autocomplete, buttons)
│   ├── guildCreate.ts              # 'guildCreate' - uses lib/ for guild initialization
│   ├── guildDelete.ts              # 'guildDelete'
│   └── voiceStateUpdate.ts         # 'voiceStateUpdate' - uses lib/music for voice gateway
├── handlers/                       # Core routing and dispatch
│   ├── commands.ts                 # Dynamic command router & dispatch
│   ├── events.ts                   # Event registrar (binds client.on / client.once)
│   └── registry.ts                 # Dynamic metadata registry and categorization
├── lib/                            # Modular shared libraries, modules, and utilities (Used by commands AND events)
│   ├── embeds/                     # Unified EmbedHandler subsystem
│   │   ├── builder.ts              # EmbedHandler class (fluent builder)
│   │   ├── limits.ts               # EMBED_LIMITS, clampTitle, clampDescription
│   │   ├── responses.ts            # EPHEMERAL, embedResponse, embedMessage
│   │   ├── variants.ts             # EmbedVariant styles, colors, and emojis
│   │   └── index.ts                # Barrel export for embeds
│   ├── music/                      # Music libraries & formatting
│   │   ├── format.ts               # Track duration & progress bar formatting
│   │   └── voice.ts                # Voice channel validation & gateway helpers
│   ├── admin/                      # Moderation & permission utilities
│   │   ├── permissions.ts          # Native permission checks & role hierarchy
│   │   └── modlog.ts               # Mod log embed dispatch
│   └── feeds/                      # Feed formatting and delivery helpers
└── utils/                          # Discord API typings & constants
    ├── types.ts                    # Discord interaction, command, and channel types
    ├── embeds.ts                   # Legacy feed & game embed builders
    └── klipy.ts                    # Entertainment GIF API helper
```

---

## 3. Command File Standard (`src/bot/commands/`)

### Rules for Command Files:
1. **One command per file**: Grouped into domain categories (`admin/`, `entertainment/`, `feeds/`, `music/`, `utility/`).
2. **Colocated Definition, Options, and Handlers**:
   - Subcommands and options are declared directly in the command file, ensuring complete visibility of options, choices, and types.
   - `export const <name>CommandDef: ApplicationCommand = { ... }`.
   - `export async function handle<Name>Command(interaction, deps, rest): Promise<InteractionResponse>`.
3. **Dynamic Execution & Registration**:
   - Commands register themselves dynamically via `registerCommandMetadata(...)` or registry maps rather than large rigid static tables.
   - Dynamic autocomplete generators dynamically query available sources, categories, or choices.
4. **Feature Flag Check**: Always verify `deps.config.features.<feature>Enabled`.
5. **Guild-Only Validation**: If the command requires a server, check `if (!interaction.guild_id)`.
6. **EmbedHandler Responses**: All responses must use `EmbedHandler.for(deps)` from `src/bot/lib/embeds/builder.js`. Never return raw unbranded embeds or magic numbers (`flags: 64` -> `.respond(true)` or `EPHEMERAL`).

---

## 4. Shared Libraries in `src/bot/lib/`

The `src/bot/lib/` directory contains reusable modules, helpers, and utilities shared across **both commands and events**:

1. **`lib/embeds/`**: The fluent `EmbedHandler` builder, response factories, and limits clamping (used by commands and event dispatchers).
2. **`lib/music/`**: Audio formatting, progress bar generation, and voice channel validation (used by music commands and `voiceStateUpdate` events).
3. **`lib/admin/`**: Permission bitfield utilities, role hierarchy comparison, and mod-log dispatch (used by moderation commands and guild audit events).
4. **`lib/feeds/`**: Feed formatting and channel dispatch utilities (used by `/feed` commands and background feed watchers).

Both commands and events import from `src/bot/lib/<module>/` to reuse logic without duplicating code.