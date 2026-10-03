# Skill: HELIX Discord Bot Development Workflow

## Purpose
Comprehensive operational workflow for engineering features, commands, events, and persistence within the **HELIX Discord Bot** codebase following strict discord.js standards.

---

## Prerequisites
- Read `.agents/rules/discord-js-standards` (MANDATORY Rule 06)
- Read `.agents/rules/typescript-architecture` (Rule 02)
- Familiarity with discord.js v14 and native Node.js ESM

---

## Core Development Workflows

### 1. Adding a New Slash Command
1. **Define options**: colocate `const <name>Options: ApplicationCommandOption[]` in the command file. Only factor it out to `src/bot/lib/options/<command>.ts` when the schema is genuinely large (precedent: `ticket.ts`, `welcome.ts`).
2. **Implement command**: create `src/bot/commands/<category>/<command>.ts`:
   - Export `<name>CommandDef: ApplicationCommand` (with `default_member_permissions` via `PermissionFlagsBits`; **no** `dm_permission` — deprecated).
   - Export `handle<Name>Command(interaction, deps, rest): Promise<InteractionResponse>`.
   - Gate features with `isFeatureEnabled(deps, guildId, '<feature>')` from `src/bot/lib/prefix/features.js` — **not** `deps.config.features`.
   - Validate guild presence (`interaction.guild_id`).
   - Use `EmbedHandler.for(deps)` for all responses (`.respond(true)` for ephemeral, `.respond()` for public).
   - Export `<name>Command: BotCommand` — the registrable unit.
   - Call `registerCommandMetadata({...})` at the bottom of the file.
3. **Registration is automatic**: `src/bot/handlers/loader.ts` discovers the module and registers the `BotCommand`. There is no static index and no manual dispatch `case` to add — `src/bot/handlers/commands.ts` looks commands up in the registry at runtime.
4. **Verify**: run `npm run check && npm run build`. Limit violations throw at load time from `validateCommandLimits`.

### 2. Adding a New Event Handler
1. **Create event file**: `src/bot/events/<eventName>.ts`.
2. **Export interface**:
   - `export const name = '<eventName>';`
   - `export const once = false;` (true only for `ready`).
   - `export async function execute(client, deps, ...args): Promise<void>`.
3. **Verify**: Run `npm run check && npm run build`. Events are auto-registered by `src/bot/handlers/events.ts`.

### 3. Embed Response Conventions
```ts
// Ephemeral Error
EmbedHandler.for(deps).error().title('Operation Failed', '❌').description('Error details').respond(true);

// Public Success
EmbedHandler.for(deps).success().title('Setting Saved', '✅').description('Configuration updated.').respond();

// Public Warning
EmbedHandler.for(deps).warning().title('Warning', '⚠️').description('Rate limit approaching.').respond();

// Diagnostic Info
EmbedHandler.for(deps).info().title('Diagnostics', 'ℹ️').field('Status', 'Operational', true).respond();

// Channel Message Payload (Direct send)
await bot.sendChannelMessage(channelId, EmbedHandler.for(deps).success().title('Announcement').message());
```

---

## Pre-Commit Verification Checklist

Before submitting changes, every agent must verify:
- [ ] `npm run check` passes (`tsc --noEmit`, `prettier --check src`, `eslint src --max-warnings 0`).
- [ ] `npm run build` compiles cleanly to `dist/`.
- [ ] No raw magic numbers: no `flags: 64` (use `.respond(true)` / `EPHEMERAL`), no `type: 4` (use `InteractionResponseType`).
- [ ] No hardcoded `'HELIX Discord Bot'` strings (use `appDisplayName(deps)`).
- [ ] Command file exports only the command and its colocated parts — nothing reusable (Rule 06 §3.1).
- [ ] Options are colocated in the command file unless the schema is genuinely large.
- [ ] Required options precede optional ones; no `autocomplete` combined with `choices`.
- [ ] No `dm_permission`; use `default_member_permissions` via `PermissionFlagsBits`.
- [ ] The command exports a `BotCommand`; no manual registration or dispatch wiring added.