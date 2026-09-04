# BUG-005: TypeScript Strict Mode Errors After Discord.js Vanilla Migration

## Metadata
- **Bug ID**: BUG-005
- **Priority**: High
- **Status**: Resolved
- **Target Phase**: Phase 7
- **Component**: `src/handlers/`, `src/commands/`, `src/types/`, `src/client.ts`

## Description
After migrating from discordx to vanilla discord.js, `tsc --noEmit` reported multiple type errors.

## Resolution

| Error | Fix Applied |
|-------|-------------|
| `import.meta.glob` not recognized | Added `ImportMeta.glob()` declaration in `src/types/vite-env.d.ts` |
| `execute` return type mismatch | Changed return type to `Promise<any>` in `CommandDefinition` |
| `.author` on union types (ban, kick, etc.) | Changed to `message?.author.id \|\| interaction!.user.id` pattern |
| `HelixBotClient` not exported | Added `HelixBotClient` wrapper class to `src/client.ts` |
| Event handler type mismatch | Cast `event.name as any` in `event-handler.ts` |

`npm run typecheck` passes with zero errors.
