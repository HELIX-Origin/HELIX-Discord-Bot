# Rule 02: Discord Bot Architecture & Source Conventions

## Mandatory Invariants
1. **Vanilla discord.js**: Do NOT use decorator frameworks (e.g. discordx). Use standard discord.js Client with `CommandDefinition` and typed event listeners.
2. **Unified Command Execution**: Every command definition must implement `execute(context: ExecuteContext)` handling both text prefix (`>`) and slash command (`/`) invocations uniformly.
3. **No Index Files in Subdirectories**: Do NOT create `index.ts` files inside `commands/`, `events/`, `handlers/`, or `plugins/` subfolders. Handlers use `import.meta.glob` or directory scanning; index files in subdirectories crash discovery loops.
4. **Named Exports Only**: All commands and events must use named exports (e.g. `export const ping: CommandDefinition = { ... }`).
5. **Self-Contained Bot Package**: The production bot code lives strictly in `HELIX/`. Root `package.json` is development/test only.
