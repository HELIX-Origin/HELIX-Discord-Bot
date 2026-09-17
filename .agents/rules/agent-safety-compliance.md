# Rule 00: Agent Safety, Instruction Compliance & Damage Prevention

## Purpose
This is the foundational safety rule for all AI agents working on **HELIX Discord Bot**. It guarantees that no irreversible damage is done to code, data, assets, or Git history, and ensures that agents strictly obey user instructions without regression or unintended side effects.

---

## 1. Zero Irreversible Damage (Safety Invariants)

1. **No Destructive File Deletions**:
   - Never perform bulk, unverified, or recursive force-deletions (`rm -rf`, `Remove-Item -Recurse -Force`) on `src/`, `wiki/`, `.agents/`, `.github/`, or data directories without explicit user authorization.
   - Deleting a stale or obsolete file requires verification via search (`grep_search`) to confirm it is no longer referenced anywhere in the repository before removal.

2. **Database & State Protection**:
   - Never corrupt, truncate, or overwrite the SQLite database (`data/database.sqlite`) directly.
   - All state mutations must flow through the repository layer (`src/db/repository.ts`) with write-through caching to in-memory `AppState`.
   - Never create duplicate mutable state stores; `AppState` is the single in-memory source of truth synchronized with SQLite.

3. **Git & Repository Safety**:
   - **NEVER** force-push (`git push --force`, `git push -f`) to `main` or any shared upstream branch.
   - Never discard or reset uncommitted user work without explicit confirmation.
   - Always run `git status` before performing Git operations. Inspect diffs to ensure only intentional changes are staged.

4. **Secrets & Credentials Protection**:
   - **NEVER** commit, hardcode, or log sensitive credentials:
     - `DISCORD_TOKEN`, `DISCORD_CLIENT_SECRET`, `DISCORD_CLIENT_ID`
     - `LAVA_PASS`, `GENIUS_ACCESS_TOKEN`, `SPOTIFY_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`
     - `YOUTUBE_API_KEY`, `TWITCH_CLIENT_SECRET`, `KLIPY_API_KEY`
     - OAuth state tokens, session tokens, or password hashes
   - All credentials belong exclusively in `.env` (which is git-ignored). `.env.example` serves strictly as a template with placeholder values.
   - Mask credentials in log outputs (`logger.info`, `logger.warn`, `logger.error`).

5. **Configuration File Preservation**:
   - Never alter configuration files (`tsconfig.json`, `package.json`, `eslint.config.js`) in a way that breaks strict typing or removes required project scripts.

---

## 2. Strict Instruction Following & Anti-Regression

1. **Unconditional Obedience to Explicit User Directives**:
   - When the user directs an architectural standard (e.g. "strictly adhere to discord.js requirements", "forum thread delivery per feed", "weekly Sunday free games"), agents MUST implement it cleanly across all affected modules.
   - Never reintroduce retired, deprecated, or forbidden patterns (e.g. Cloudflare OAuth, PaaS/cloud deploy scripts, status monitors).

2. **Zero Unsolicited Framework Injection (Rule 01)**:
   - Do not add runtime dependencies (`npm install <pkg>`) without explicit user permission. The runtime stack is deliberately minimal: native Node.js HTTP, `node:sqlite`, `discord.js`, and `ioredis-mock`.

3. **Discord.js Standards (Rule 06)**:
   - All Discord interactions, commands, events, and embeds MUST comply with Rule 06 (`discord-js-standards.md`).

4. **Verification Gate Before Task Completion**:
   - No task is complete until verified through the repository validation gate:
     ```bash
     npm run check   # Runs typecheck, format:check, and lint
     npm run build   # Verifies TypeScript compilation to dist/
     ```
   - If any type, lint, or format error is introduced, resolve it immediately before reporting completion.

5. **Documentation & Agent Synchronization (Rule 04 & 05)**:
   - Changes to commands, features, or architecture must be updated in `AGENTS.md`, `wiki/`, and `.agents/`.