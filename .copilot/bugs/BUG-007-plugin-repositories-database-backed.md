# Bug Report: BUG-007 Plugin repositories cloned to filesystem instead of stored in database

## Metadata
- **Bug ID**: BUG-007
- **Status**: Resolved
- **Priority**: High
- **Component**: Plugins
- **Reported Date**: 2026-09-04
- **Resolved Date**: 2026-09-05
- **Target Resolution**: Phase 8 / Phase 9 correction
- **GitHub Issue**: [#13](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/13)

---

## Sub-Issues & Milestone Breakdown

```mermaid
flowchart TD
    Parent["Parent Bug: BUG-007 (#13) ✅"] --> Sub1["Sub-Issue 1: Root Cause & Diagnostics (#14) ✅"]
    Sub1 --> Sub2["Sub-Issue 2: Core Fix & Implementation (#15) ✅"]
    Sub2 --> Sub3["Sub-Issue 3: Test Suite & Regression Checks (#16) ✅"]
    Sub3 --> Sub4["Sub-Issue 4: Verification & Docs Sync (#17) ✅"]
```

- [x] **Sub-Issue 1: Root Cause & Diagnostics** ([#14](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/14)) — Audit clone-to-disk flow; define DB schema + sandboxed entry execution contract.
- [x] **Sub-Issue 2: Core Fix & Implementation** ([#15](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/15)) — DB-backed, guild-scoped loader/registry; sandboxed executor; reworked `>plugin` command; remove community dir flow.
- [x] **Sub-Issue 3: Test Suite & Regression Checks** ([#16](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/16)) — Unit + integration tests for DB storage, per-guild scoping, sandboxed execution, and zero filesystem writes.
- [x] **Sub-Issue 4: Verification & Docs Sync** ([#17](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/17)) — Update plans/docs; resolve and close.

---

## Description
The plugin engine installed community plugins by `git clone`-ing a GitHub repository into `HELIX/src/plugins/community/<repo>/` and importing entry `.ts` files from disk into a global registry. This is a design mis-sight: plugin repositories should be stored in the database as the source of truth with per-guild scoping, never downloaded into the bot filesystem.

## Target Architecture

```mermaid
flowchart LR
    Owner["Guild Owner"] --> Cmd["> plugin repo add owner/repo"]
    Cmd --> Fetch["Fetch config.json + plugin.json + entry source"]
    Fetch --> Validate["Validate manifests"]
    Validate --> DB[("SQLite plugin_repositories - guild scoped")]
    Builtin["HELIX built-ins (first-party source)"] --> Loader["Guild-aware Plugin Loader"]
    DB --> Loader
    Loader --> Registry["Runtime Registry - guild-aware"]
```

## Design Decisions
1. Built-in `helix-origin` plugins stay as first-party source code on disk (trusted core).
2. Imported / community / custom repos stored entirely in the database (`config.json`, `plugin.json` manifests, entry source text).
3. Per-guild rows (`guild_id` nullable); repos without a guild are global.
4. Entry code executes via sandboxed evaluation of stored source (no disk materialization).
5. `>plugin` command reworked: `list`, `install`, `remove`, `info`, `enable`, `disable`, plus per-guild `repo add` / `repo list` / `repo remove`.
6. The `git clone` install flow and `HELIX/src/plugins/community/` directory are removed.

## Steps to Reproduce
1. Run `>plugin install owner/repo`.
2. The bot previously `git clone`d the repository into `HELIX/src/plugins/community/`.
3. Plugins were registered globally with no per-guild scoping.
4. A guild owner had no way to manage a repo scoped only to their guild.

## Expected Behavior
- No plugin content is downloaded into the bot filesystem.
- Plugin repos stored in the database with optional `guild_id` scoping.
- Entries execute via sandboxed evaluation of stored source.
- Guild owners can add/list/remove their own repos within their guild.

## Actual Behavior
- Resolved: SQLite database table `plugin_repositories` stores repo configs, manifests, and sources.
- Entries execute in a secure isolated `node:vm` sandbox with zero disk footprint.
- Full per-guild repository and plugin scoping implemented in `registry.ts`, `plugin-loader.ts`, and `plugin.ts`.

## Environment Details
- **OS**: Windows / Linux / macOS
- **Node.js Version**: v22.x
- **HELIX Version**: 1.0.0

## Root Cause Analysis
The plugin engine was implemented to load from the repository tree rather than from the database, and per-guild repo scoping was never specified in the original plugin system design (Phase 8 / Phase 9).

## Resolution & Fix
- Added `plugin_repositories` table and CRUD methods (`addPluginRepository`, `getPluginRepository`, `listPluginRepositories`, `removePluginRepository`, `setPluginRepositoryEnabled`, `getAllStoredPluginRepositories`) in `HELIX/src/db/database.ts`.
- Created `executePluginSandbox` in `HELIX/src/plugins/sandbox.ts` using `node:vm` to safely evaluate plugin code without external filesystem write permissions.
- Upgraded `HELIX/src/plugins/registry.ts` to support guild scoping with global fallback for plugins, extensions, and stats.
- Reworked `HELIX/src/plugins/plugin-loader.ts` to fetch via HTTPS GitHub raw API and persist directly to SQLite, eliminating `git clone` and `community/` directory dependencies.
- Updated `>plugin` command in `HELIX/src/commands/config/plugin.ts` to support `repo add`, `repo list`, `repo remove`, and guild-scoped plugin execution.
- Added comprehensive unit tests in `tests/unit/db/database.test.ts`, `tests/unit/plugins/sandbox.test.ts`, and `tests/unit/plugins/registry.test.ts`.