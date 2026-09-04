# Rule 00: Agent Safety, Instruction Compliance & Damage Prevention

## Purpose
This is the foundational safety rule for all AI agents, pair programmers, and automated assistants working on this repository. It guarantees that no irreversible damage is done to code, data, assets, or Git history, and ensures that agents strictly obey user instructions without deviation or regression.

---

## 1. Zero Irreversible Damage (Safety Invariants)

1. **No Destructive File Deletions**:
   - Never perform bulk, unverified, or recursive force-deletions (`rm -rf`, `Remove-Item -Recurse -Force`) on project directories without explicit user authorization.
   - Temporary test fixtures or scratch files must only be cleaned within their designated sandbox directories.

2. **Database & State Protection**:
   - Never execute destructive SQL statements (`DROP TABLE`, `DROP DATABASE`, `TRUNCATE`, or `DELETE` without a strict `WHERE` clause) on production or development databases.
   - Schema alterations must always use non-destructive migrations in `HELIX/src/db/database.ts`.

3. **Git & Repository Safety**:
   - **NEVER** force-push (`git push --force`, `git push -f`) to `main` or any shared upstream branch.
   - Never reset or destroy uncommitted user work without explicit confirmation. Always check `git status` before performing git operations.

4. **Binary & Asset Preservation**:
   - Never alter, overwrite, or treat binary assets (e.g., `.png`, `.jpg`, `.ogg`, `.wav`, `.db`, `.sqlite`, `.exe`) as UTF-8 text. Binary templates and assets must be handled with raw byte preservation.

5. **Secrets & Credentials Protection**:
   - Never hardcode, commit, or log sensitive environment variables (`DISCORD_TOKEN`, `CLIENT_SECRET`, session cookies, API keys).
   - All secrets must be loaded via typed accessors in `HELIX/src/env.ts` with template placeholders in `.env.example`.

---

## 2. Strict Instruction Following & Anti-Regression

1. **Unconditional Obedience to Explicit User Directives**:
   - When the user directs an architectural change (e.g., "drop AI features entirely", "use messages.json for all message and embed formatting", "use vanilla discord.js"), the agent MUST follow it across 100% of the codebase.
   - Never reintroduce deleted, deprecated, or forbidden patterns that the user explicitly ordered to remove.

2. **No Unsolicited Framework Injection**:
   - Do not install unauthorized external libraries, decorators, or heavy frameworks (e.g., discordx, ORMs) when vanilla discord.js and native standard libraries are specified.

3. **Single Source of Truth for Messages**:
   - Do not construct hardcoded inline Discord embeds or raw string responses in command source files. All messages, embeds, error messages, and event logs MUST be routed through `message-handler.ts` backed by `messages.json`.

4. **Verification Requirement Before Task Completion**:
   - No task is complete until verified. The agent must run:
     ```bash
     npm test             # All unit and integration tests must pass
     npm run typecheck    # TypeScript strict mode must pass with 0 errors
     npm run test:types   # Test typing must pass with 0 errors
     ```
   - If any test or type error is introduced, it must be resolved immediately before handing control back to the user.
