# Rule 06: Discord Bot Command & Event Structure

## Purpose
This rule enforces the Discord.js-inspired file structure for all bot commands and events. Following this structure ensures:
- Commands register correctly via the handler
- Events dispatch without naming conflicts
- New contributors can quickly locate and add functionality
- No `index.ts` files exist in command/event directories (bot.ts is the sole entry point)

## Mandatory Command File Structure

### Commands Live In: `src/bot/commands/`
Each command must be in its own file named after the command, with `.ts` extension. No `index.ts` is permitted in the commands directory.

```
src/bot/commands/
├── feeds.ts          # /feed command — manages RSS/Atom/scrape feeds
├── music.ts          # /play /queue /skip /jump /leave /volume /equalizer /nowplaying /seek /shuffle /loop
├── gif.ts            # /gif /slap /hug /kiss /pat /bonk /cuddle /tickle /pet /poke /baka /smug /cry /angry /meme
├── set.ts            # /set command
├── ticket.ts         # /ticket command
└── welcome.ts        # /welcome command
```

### Command File Requirements
- **Export `commandDef`**: The file must export an `ApplicationCommand` definition object with `name` and `description` properties, plus `options` for subcommands.
- **Export `handleCommand`**: The file must export an async function `handleCommand(interaction, deps, rest)` that processes the interaction and returns a `InteractionResponse`.
- **No Default Export**: Use named exports only (`export const commandDef`, `export async function handleCommand`).
- **Feature Flag Gating**: Commands respect `getEnabledCommands(deps)` — if the command's feature flag is disabled, the handler should not execute.
- **Help Responses**: Missing args/subcommands should call `commandHelpResponse()` from `src/bot/handlers/embeds.ts` rather than failing silently.

### Command Naming Conventions
- Use kebab-case or short identifier: `feed`, `music`, `gif`, `set`, `ticket`, `welcome`
- Subcommand options use snake_case: `feed_type`, `enabled`, `id`
- Command descriptions are user-facing; keep them concise and action-oriented

## Mandatory Event File Structure

### Events Live In: `src/bot/events/`
Each event must be in its own file named after the Discord event, with `.ts` extension.

```
src/bot/events/
├── ready.ts          # Bot ready event — login, sync commands, setup
├── message-create.ts # messageCreate event
└── interaction-create.ts # interactionCreate event
```

### Event File Requirements
- **Export `handler`**: The file must export an async function `handler(event, deps)` where `event` is the Discord API event payload.
- **No Default Export**: Use named exports only (`export const handler`).
- **Idempotent**: Events should not crash on repeated execution; guard against double-setup.
- **Feature Flag Gating**: Events respect feature flags where applicable (e.g., administration events only fire when `ADMINISTRATION_ENABLED` is true).

### Event Naming Conventions
- Use the Discord event name exactly: `messageCreate`, `interactionCreate`, `ready`
- File names use kebab-case matching the event: `message-create.ts`, `interaction-create.ts`, `ready.ts`

## Registration Pattern

### Bot Entry Point: `src/bot/bot.ts`
The bot.ts file is the sole entry point for client setup and registration:

```typescript
// src/bot/bot.ts — minimal example
import { createBot } from './bot.js'; // or manual ClientBuilder
import { commandDefs } from './commands'; // auto-aggregated or manual import
import { eventHandlers } from './events';

// Register all slash commands
for (const def of commandDefs) {
  await rest.put(Routes.applicationCommand(def.id), { body: def });
}

// Register event listeners
for (const [event, handler] of Object.entries(eventHandlers)) {
  client.on(event, (interaction) => handler(interaction, deps));
}
```

## Prohibited Patterns

The following are **not allowed** and will cause build/registration failures:

- ❌ `src/bot/commands/index.ts` — never create an index.ts in the commands folder
- ❌ `src/bot/events/index.ts` — never create an index.ts in the events folder  
- ❌ Generic command names that don't match file names
- ❌ Multiple commands in a single file (unless they are subcommand-groups under one parent)
- ❌ Events defined outside `src/bot/events/`

## Verification

After any changes, run:
```bash
npm run typecheck    # tsc --noEmit must pass
npm run build        # build must succeed
```

If `index.ts` exists in `src/bot/commands/` or `src/bot/events/`, the build will fail with naming conflicts.