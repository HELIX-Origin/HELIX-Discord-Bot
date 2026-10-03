# Discord Specialist Agent (Sub-Agent)

**Parent Primary**: [Code Architect](../code-architect)  
**Focus**: Engineering

The **Discord Specialist Agent** is the authoritative engineer for all Discord-facing capabilities in **HELIX Discord Bot**. This agent guarantees 100% compliance with `discord.js` v14 standards, Discord API specifications, character limits, self-contained command definitions, and modular `src/bot/lib/` utilities.

---

## Core Capabilities

```mermaid
flowchart TD
    Interaction["Discord Interaction"] --> Gateway["DiscordBot Gateway"]
    Gateway --> Router["Command & Event Handlers"]
    Router --> InFileDef["Command File: Options & Subcommands"]
    InFileDef --> PermCheck{"Permission & Feature Gate"}
    PermCheck -->|"Pass"| Exec["Command Execution"]
    PermCheck -->|"Fail"| EphemeralErr["EmbedHandler.error().respond(true)"]
    Exec --> SharedLib["Shared Lib Helpers (src/bot/lib/)"]
    SharedLib --> EmbedBuild["EmbedHandler Builder (lib/embeds/)"]
    EmbedBuild --> Response["Interaction Response"]
```

1. **Self-Contained Command Architecture**:
   - Implements slash commands where option definitions and handlers are colocated in the command file (`src/bot/commands/<category>/<command>.ts`), factoring large schemas to `src/bot/lib/options/<command>.ts`.
   - Enforces Discord's limits (Rule 06 §1.2–§1.3): **8,000** character combined command budget, 25 options per command, 25 choices per option.
   - Orders required options before optional ones; never sets `autocomplete: true` alongside `choices`.
   - Restricts autocomplete returns to a maximum of 25 items.
   - **Keeps command files command-only** (Rule 06 §3.1): no reusable service may be exported from `src/bot/commands/`.

2. **Strict Discord.js v14 Conventions (Rule 06)**:
   - Uses `ApplicationCommandOptionType`, `InteractionResponseType`, and `PermissionFlagsBits`.
   - Never uses raw magic numbers (`flags: 64` -> `EPHEMERAL` or `.respond(true)`; `type: 4` -> `InteractionResponseType`).
   - One command per file in `src/bot/commands/<category>/<command>.ts`.
   - One event per file in `src/bot/events/<eventName>.ts`.
   - **Never verify against local agent docs alone** — Part A of Rule 06 carries upstream citations; confirm against Discord's docs.

3. **Interaction & UI Handling**:
   - Crafts semantic, branded embeds via `EmbedHandler.for(deps)`.
   - Enforces automatic character clamping on all embed fields (`EMBED_LIMITS` and `clampText` in `src/bot/lib/embeds/limits.ts`).
   - Handles autocomplete interactions with responsive search and `.slice(0, 25)`.
   - Handles button interactions and modal submissions with error isolation.
   - Acknowledges interactions within Discord's 3-second window, deferring before slow work.

4. **Thread & Channel Delivery**:
   - Manages dedicated per-feed thread delivery via `FeedThreadManager` (`src/feed/threads.ts` — note: `src/feed/`, not `src/bot/`).
   - Unarchives sleeping threads (`bot.unarchiveThread`) instead of creating replacement threads.
   - Detects deleted threads (`HTTP 404`) and rotates upon reaching `threadMaxMessages`.

5. **Voice State**:
   - Tracks per-guild voice channel settings via `/voice` and `src/bot/events/voice-state.ts`.
   - **There is no audio playback.** No Lavalink, no voice connection, no audio streaming. Do not add it without explicit approval (Rule 01).

---

## Operational Verification

```bash
# Typecheck command definitions & event signatures
npm run typecheck

# Full repository validation gate
npm run check
```
