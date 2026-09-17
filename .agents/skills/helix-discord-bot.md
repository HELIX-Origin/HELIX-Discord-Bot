# Skill: HELIX Discord Bot Development Workflow

## Purpose
Comprehensive operational workflow for engineering features, commands, events, and persistence within the **HELIX Discord Bot** codebase following strict discord.js standards.

---

## Prerequisites
- Read `.agents/rules/discord-js-standards.md` (MANDATORY Rule 06)
- Read `.agents/rules/typescript-architecture.md` (Rule 02)
- Familiarity with discord.js v14 and native Node.js ESM

---

## Core Development Workflows

### 1. Adding a New Slash Command
1. **Define options**: Create `src/bot/lib/options/<command>.ts` exporting typed `ApplicationCommandOption[]`.
2. **Implement command**: Create `src/bot/commands/<category>/<command>.ts`:
   - Export `<command>CommandDef: ApplicationCommand`.
   - Export `handle<Command>Command(interaction, deps, rest): Promise<InteractionResponse>`.
   - Check `deps.config.features.<feature>Enabled`.
   - Validate guild presence (`interaction.guild_id`).
   - Use `EmbedHandler.for(deps)` for all responses (`.respond(true)` for ephemeral, `.respond()` for public).
   - Call `registerCommandMetadata({...})` at the bottom of the file.
3. **Register command**: Add definition import and conditional push to `getEnabledCommands()` in `src/bot/commands/registry.ts`.
4. **Dispatch command**: Add import and `case '<command>':` handler call to `src/bot/handlers/commands.ts`.
5. **Verify**: Run `npm run check && npm run build`.

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
- [ ] Every command has its own file in `src/bot/commands/<category>/`.
- [ ] Command options are extracted to `src/bot/lib/options/<command>.ts`.
- [ ] Command is registered in `help-registry.ts`, `registry.ts`, and dispatched in `handlers/commands.ts`.