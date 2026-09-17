# Skill: TypeScript ESM & Native Node.js Development

## Environment & Tooling
- **Node.js**: `>=22.9` with native ECMAScript Modules (`"type": "module"` in `package.json`).
- **TypeScript**: Strict compilation with `tsconfig.json` (`tsc --noEmit`).
- **Native Runtime Modules**: `node:http`, `node:sqlite`, `node:crypto`, `node:path`, `node:fs`.
- **Configuration**: Native environment file loading via `node --env-file-if-exists=.env` (no third-party `dotenv`).
- **Formatting & Linting**: Prettier (`format`) and ESLint with TypeScript ESLint (`lint`).

---

## TypeScript ESM Invariants

1. **Mandatory `.js` Relative Import Extensions**:
   ```ts
   // ✅ CORRECT
   import { AppConfig } from './config.js';
   import type { Repository } from '../db/repository.js';

   // ❌ WRONG (fails in Node.js ESM)
   import { AppConfig } from './config';
   import type { Repository } from '../db/repository';
   ```

2. **Type-Only Imports**:
   Always use `import type { ... }` when importing interfaces, type aliases, or types used only in type annotations.

3. **In-Memory Primary Layer (`AppState`)**:
   - High-throughput read paths hit `AppState` Maps/Sets directly.
   - Persistence is write-through via `src/db/repository.ts` which commits to `node:sqlite` and updates `AppState`.

4. **Zero Magic Numbers in Discord Code**:
   - `flags: EPHEMERAL` or `.respond(true)` instead of `flags: 64`.
   - `InteractionResponseType` instead of `type: 4`.