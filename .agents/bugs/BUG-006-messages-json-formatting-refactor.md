# Bug Report: [BUG-006] Centralized Message Formatting Engine & messages.json Refactor

## Metadata
- **Bug ID**: BUG-006
- **Status**: Resolved
- **Priority**: High
- **Component**: Discord Bot / Message Handler / Embeds
- **Reported Date**: 2026-09-04
- **Target Resolution**: Phase 7 / Phase 8

---

## Description
Message and embed responses were hardcoded across various command definitions with manual inline string templates and ad-hoc `EmbedBuilder` calls, bypassing `messages.json`. The bot was intended to use `messages.json` as a single source of truth for message and embed formatting schemas, interpolation, colors, and standard error handling.

## Steps to Reproduce
1. Execute commands (`>ban`, `>kick`, `>ping`, `>set`, `>ticket`, `>create`, etc.).
2. Observe inline hardcoded EmbedBuilders and raw error responses scattered across individual command files.
3. Edit `messages.json` and notice changes did not propagate to command responses.

## Expected Behavior
All command replies, embed structures (titles, descriptions, fields, footers, colors), gateway event logs, and error responses should be dynamically loaded and interpolated via `message-handler.ts` using schemas defined in `messages.json`.

## Actual Behavior
Hardcoded raw strings and inconsistent embed styles were generated across command source files.

## Environment Details
- **OS**: Cross-platform (Windows / Linux / macOS)
- **Node.js Version**: >= v22.0.0
- **discord.js**: ^14.16.3

## Root Cause Analysis
Previous implementations constructed embeds directly inside each command file rather than routing through a unified message schema parser with variable interpolation.

## Resolution & Fix
1. Rewrote `HELIX/src/handlers/message-handler.ts` to implement:
   - `createEmbed(key, vars, prefix)`: Deep JSON schema interpolation, hex/named color parsing, field iteration, and EmbedBuilder generation.
   - `getMessage(key, vars, prefix, fallback)`: String and description extraction with variable interpolation.
   - `formatError(keyOrMsg, vars, prefix)`: Standardized error embed generation with error key resolution.
   - `formatSuccess(title, description, vars)`: Standardized success embed generation.
2. Refactored all 23 native commands across Moderation, Utility, Info, Project, and Config categories to use `message-handler.ts`.
3. Updated ticket interaction handlers (`tickets.ts`) and gateway event listeners (`ready.ts`, `guild-create.ts`, `guild-delete.ts`) to use `messages.json`.
4. Added comprehensive test coverage in `tests/unit/message-handler.test.ts`.
