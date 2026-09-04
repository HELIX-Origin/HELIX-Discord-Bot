# HELIX CLI - Phase 5: Testing Suite & Verification Infrastructure

## Goals & Objectives
Establish a comprehensive automated testing suite inside the `tests/` directory to debug, test, and verify all CLI commands, template generation, template parsing, and AI credential resolution across operating systems.

## `tests/` Directory Architecture

```
tests/
├── README.md                 # Testing documentation, guidelines, and commands
├── unit/                     # Fast in-memory unit tests
│   ├── cli-parser.test.ts    # Argument & flag parsing tests
│   ├── template-engine.test.ts # Variable substitution & conditional logic
│   ├── auth-copilot.test.ts  # GitHub CLI / Copilot auth discovery
│   ├── auth-antigravity.test.ts # Antigravity config & env fallback
│   └── auth-opencode.test.ts # OpenCode config & env fallback
├── integration/              # Integration tests interacting with file system
│   ├── create-discord.test.ts# Discord bot project generation in temp dir
│   ├── create-web.test.ts    # Web React/Vue/Svelte project generation
│   ├── create-desktop.test.ts# Electron/Tauri scaffolding
│   ├── create-mobile.test.ts # Flutter/React Native scaffolding
│   ├── create-games.test.ts  # Unity/Godot/RPGM/RenPy scaffolding
│   └── create-backend.test.ts# Rust/Go/Java/Python scaffolding
├── fixtures/                 # Static mock data & mock environments
│   ├── mock-configs/         # Mock hosts.json, auth.json, .env files
│   ├── mock-templates/       # Valid and invalid sample YML templates
│   └── expected-trees/       # Golden file trees for output verification
└── helpers/                  # Test helpers
    ├── temp-dir.ts           # Isolated temp sandbox creation & cleanup
    └── mock-env.ts           # Environment variable mocker
```

## Testing Technologies & Tools
- **Test Runner**: Vitest (ESM native, ultra-fast parallel execution).
- **Assertions & Spies**: Vitest built-in `describe`, `it`, `expect`, `vi.fn()`, `vi.spyOn()`.
- **Process Testing**: `execa` for spawning the compiled CLI binary in sub-processes.
- **File Verification**: `memfs` or real temporary directories via Node `fs/promises.mkdtemp`.

## Test Scenarios & Suites

### 1. Template Engine & Variable Interpolation
- Test substitution of single `${VAR}` and multiple variables in the same file.
- Test missing required variables throwing descriptive errors.
- Test default variable fallbacks when optional variables are not supplied.

### 2. AI Credential Resolution Waterfall
- Test client auth discovered when `gh auth token` succeeds.
- Test client auth discovered when `hosts.json` exists in mock app data.
- Test fallback to `.env` when client is not installed.
- Test graceful failure and `authenticated: false` when neither is found.

### 3. End-to-End Scaffolding Verification
- For each supported template, run CLI in a clean temp directory with `--skip-install --skip-git`.
- Verify expected files exist (e.g. `package.json`, `src/index.ts`, `.env.example`).
- Verify generated source files contain no un-interpolated `${...}` placeholders.

## Verification Commands
```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Completion Status
- [x] Vitest configuration (`vitest.config.ts`) established with TypeScript ESM support.
- [x] 16 test suites implemented and passing across `tests/unit/` and `tests/integration/`.
- [x] 63 tests verifying CLI scaffolding, AI context, NextAuth dashboard, bot slash commands, SQLite database, dynamic invite URLs, and decoupled bot structure.
