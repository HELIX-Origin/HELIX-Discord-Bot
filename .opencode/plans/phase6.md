# HELIX CLI - Phase 6: Packaging, Distribution & Production Readiness

## Goals & Objectives
Prepare HELIX CLI for global distribution via npm, standalone binary releases, self-updating mechanisms, and continuous integration.

## Tasks & Deliverables

### 1. Build & Packaging Pipeline
- [x] Bundle source with `tsup` into optimized dual ESM entries:
  - `dist/index.js`: Global standalone CLI executable with shebang `#!/usr/bin/env node`.
  - `dist/bot/index.js`: Standalone Discord Bot gateway client & companion Web Dashboard launcher.
- [x] Reorganize `/bot` subsystem:
  - `/bot/src`: Discord bot gateway client, slash commands, SQLite DB engine, and `/bot/src/dist`.
  - `/bot/dashboard`: Web dashboard, NextAuth OAuth2 callbacks, and HTML UI.
  - `/bot/package.json` & `/bot/tsconfig.json`: Dedicated package metadata and build configuration.
  - `bot/src/env.ts`: Centralized, typed environment handler with multi-tier discovery.
- [x] Docker containerization & self-hosting support:
  - `Dockerfile`: Production multi-stage image (`node:22-bookworm-slim`) with automated DB setup.
  - `docker-compose.yml`: Zero-config compose service with SQLite persistent volume mount (`./data:/app/data`).
  - `.dockerignore`: Lean build context filtering.
- [x] Setup script (`scripts/setup.mjs`) clone isolation:
  - Clones upstream/fork repository from `HELIX_CLI_REPO_URL` into `.cli/`.
  - Strips `/bot` from cloned copy to prevent recursive bot duplication.
- [x] Configure executable permissions (`chmod +x bin/helix.js`).
- [x] Shebang launcher `bin/helix.js` with global npm link support.

### 2. Versioning & Self-Updating
- [x] Implement `helix --version` command.
- [x] Implement `helix update` to check npm registry for new versions.
- [x] Semantic version comparison engine (`compareVersions`) with unit tests.

### 3. CI/CD Workflows (GitHub Actions)
- [x] Matrix testing workflow (`.github/workflows/ci.yml`):
  - Windows (`windows-latest`), macOS (`macos-latest`), Linux (`ubuntu-latest`).
  - Node.js versions: 18.x, 20.x, 22.x.
  - Automated pull request and push trigger checks.
- [x] Heroku 1-Click deployment workflow (`.github/workflows/heroku-deploy.yml`):
  - Free-tier Eco Dyno allocation with zero paid add-ons.
  - Automatic GitHub Secrets synchronization to Heroku config vars.
- [x] Automated release & publishing workflow (`.github/workflows/release.yml`):
  - Triggers on semantic version tags (`v*.*.*`).
  - Automatically compiles, tests, publishes to npm, and creates GitHub Release with assets.

### 4. Documentation & Developer Experience
- [x] Comprehensive documentation at root `README.md` with official repository banner and icon.
- [x] Multi-page documentation suite in `docs/`:
  - `docs/index.md` (Hub & Architecture Overview)
  - `docs/discord-bot.md` (Bot Gateway, Slash Commands & Sharding)
  - `docs/web-dashboard.md` (NextAuth Dashboard & Live Metrics)
  - `docs/deployment-heroku.md` (Heroku 1-Click Guide)
  - `docs/deployment-docker.md` (Docker & Self-Hosting Guide)
  - `docs/scaffolding-templates.md` (14 Multi-Framework Templates)
  - `docs/ai-integration.md` (Multi-Tiered AI Discovery)
- [x] Shell auto-completion scripts for Bash, Zsh, and PowerShell (`helix completion`).
- [x] Resolved all tracked issues: BUG-001 (multi-tier config paths) and BUG-002 (binary asset preservation).

## Completion Criteria
- [x] Dual standalone executable build (`dist/index.js` and `dist/bot/index.js`) passing.
- [x] Automated test suite passing 63/63 tests across 16 test suites.
- [x] CLI can be installed globally via `npm link` or `npm install -g helix-cli`.
- [x] `helix` command runs universally on Windows PowerShell, macOS zsh, and Linux bash without errors.
