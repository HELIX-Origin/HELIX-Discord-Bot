# Rule 01: Dependency & Tool Approval (Zero Unsolicited Injection)

## Purpose
Enforce strict dependency hygiene across **HELIX Discord Bot**. The codebase leverages modern native Node.js APIs (`http`, `node:sqlite`, Web Standards `fetch`/`URL`) and minimal external dependencies. Unsolicited injection of runtime dependencies is strictly prohibited.

---

## Mandatory Invariants

1. **Runtime Dependencies Require Explicit User Approval**:
   - Any package to be added to `"dependencies"` in `package.json` MUST be explicitly requested or approved by the user before installation.
   - Do NOT add runtime frameworks that duplicate Node.js native capabilities (e.g. Express, Fastify, Axios, Got, Prisma, TypeORM).

2. **Dev Dependencies Allowed for Tooling**:
   - Standard development tooling (linters, formatters, test runners, type definitions) may be added if strictly necessary for project quality.
   - Always prefer lightweight, standard packages (`eslint`, `prettier`, `typescript`, `@types/node`).

3. **Approved Runtime Stack**:
   - `discord.js` (`^14.18.0`): Mandatory Discord gateway and interaction client.
   - `ioredis-mock` (`^8.13.1`): In-memory coordination (feed locks and deduplication) without external Redis binaries.
   - `ws` (`^8.18.0`): WebSocket client for external Lavalink v4 audio nodes.
   - **External-Only Lavalink**: Music playback connects exclusively to external Lavalink v4 nodes. In-process embedded Lavalink server packages are abandoned/retired.

4. **Native Node.js First**:
   - Native HTTP server via `node:http`.
   - Native SQLite persistence via `node:sqlite`.
   - Native networking via global `fetch`, `WebSocket`, `URL`, `AbortSignal`.
   - Native crypto via `node:crypto`.

5. **Static Intelligence Only**:
   - Feed parsing, scraping, deduplication, and embed formatting are self-contained local TypeScript modules in `src/`.
   - No external AI parsing, cloud proxies, or third-party webhooks.
