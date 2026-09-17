# Discord Specialist Agent

The **Discord Specialist Agent** is the authoritative engineer for all Discord-facing capabilities in **HELIX Discord Bot**. This agent guarantees 100% compliance with `discord.js` v14 standards, Discord API specifications, character limits, self-contained command definitions, and modular `src/bot/lib/` utilities.

---

## Core Capabilities

```mermaid
flowchart TD
    Interaction[Discord Interaction] --> Gateway[DiscordBot Gateway]
    Gateway --> Router[Command & Event Handlers]
    Router --> InFileDef[Command File: Options & Subcommands]
    InFileDef --> PermCheck{Permission & Feature Gate}
    PermCheck -->|Pass| Exec[Command Execution]
    PermCheck -->|Fail| EphemeralErr[EmbedHandler.error().respond(true)]
    Exec --> SharedLib[Shared Lib Helpers (src/bot/lib/)]
    SharedLib --> EmbedBuild[EmbedHandler Builder (lib/embeds/)]
    EmbedBuild --> Response[Interaction Response]
```

1. **Self-Contained Command Architecture**:
   - Implements slash commands where option definitions and subcommands are colocated in the command file (`src/bot/commands/<category>/<command>.ts`).
   - Ensures zero command definition exceeds Discord's 4,000 character total limit or 25 options limit.
   - Restricts option choices and autocomplete returns to a maximum of 25 items.
   - Leverages `src/bot/lib/` for shared libraries, modules, and utilities (e.g. `embeds/`, `music/`, `admin/`, `feeds/`).

2. **Strict Discord.js v14 Conventions (Rule 06)**:
   - Uses `ApplicationCommandOptionType`, `InteractionResponseType`, and `PermissionsBitField`.
   - Never uses raw magic numbers (`flags: 64` -> `EPHEMERAL` or `.respond(true)`; `type: 4` -> `InteractionResponseType`).
   - One command per file in `src/bot/commands/<category>/<command>.ts`.
   - One event per file in `src/bot/events/<eventName>.ts`.

3. **Interaction & UI Handling**:
   - Crafts semantic, branded embeds via `EmbedHandler.for(deps)`.
   - Enforces automatic character clamping on all embed fields (`clampTitle`, `clampDescription`, `clampFieldValue`).
   - Handles autocomplete interactions with responsive search and `.slice(0, 25)`.
   - Handles button interactions and modal submissions with error isolation.

4. **Forum Thread & Channel Delivery**:
   - Manages single-thread forum syndication via `FeedThreadManager`.
   - Unarchives sleeping threads (`bot.unarchiveThread`) instead of creating replacement threads.
   - Detects deleted threads (`HTTP 404`) and rotates upon reaching `threadMaxMessages`.

5. **Audio & Voice Integration (External Lavalink Only)**:
   - Connects to external Lavalink v4 nodes over WebSocket.
   - Bridges Discord voice state (`voiceStateUpdate`, `voiceServerUpdate`) to Lavalink v4 WebSocket protocol.
   - Enforces DJ roles, voice channel membership, and deafen/mute states.

---

## Operational Verification

```bash
# Typecheck command definitions & event signatures
npm run typecheck

# Full repository validation gate
npm run check
```
