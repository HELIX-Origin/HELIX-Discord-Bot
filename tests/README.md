# HELIX - Testing Suite & Verification Infrastructure

This directory houses the automated test suites, fixtures, and mocks used to verify, test, and debug the HELIX Discord bot.

## Directory Layout

```
tests/
├── README.md                 # This testing documentation
├── unit/                     # Unit test suites (in-memory, fast)
│   ├── cli-args.test.ts      # Command line parser and options
│   ├── template-engine.test.ts # Variable substitution, loops, conditionals
│   ├── auth-copilot.test.ts  # GitHub CLI token & hosts.json resolver
│   ├── auth-antigravity.test.ts # Antigravity config & session detector
│   ├── auth-opencode.test.ts # OpenCode config & session detector
│   └── code-hosting.test.ts  # gh and glab CLI detection and commands
├── integration/              # Integration test suites (filesystem & sub-processes)
│   ├── scaffolding-discord.test.ts # Discord bot project scaffolding
│   ├── scaffolding-web.test.ts     # Web dashboard projects
│   ├── scaffolding-desktop.test.ts # Desktop electron/tauri projects
│   ├── scaffolding-mobile.test.ts  # Flutter and Expo projects
│   ├── scaffolding-games.test.ts   # Godot, RPGM, Ren'Py games
│   ├── scaffolding-backend.test.ts # Rust, Go, Java, Python backends
│   └── repo-remote.test.ts         # Remote repository initialization & git remotes
├── fixtures/                 # Static mock environments
│   ├── mock-configs/         # Fake .env files and auth configs
│   │   ├── .env.example
│   │   ├── mock-antigravity.json
│   │   └── mock-opencode.json
│   ├── mock-templates/       # Sample valid and invalid template files
│   └── golden-trees/         # Expected directory outputs for validation
└── helpers/                  # Test utilities
    ├── temp-dir.ts           # Isolated temporary directory generator & cleanup
    ├── mock-exec.ts          # Process execution spy/mocker
    └── env-sandbox.ts        # Environment variable override sandbox
```

## Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run entire test suite with coverage
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## Key Test Scenarios

### 1. Template Engine & Variable Interpolation
- Validates that `${VARIABLE_NAME}` strings inside template files are correctly replaced with user inputs.
- Validates that binary files (`.png`, `.ico`, `.wav`, etc.) are preserved in byte-exact condition without UTF-8 corruption.
- Validates that missing mandatory variables trigger informative validation errors.

### 2. Plugin System Validation
- Validates repo `config.json` schema and plugin `plugin.json` manifests
- Verifies plugin interface compliance (lint, explain, suggestFixes, getDocumentation)
- Tests plugin loader discovery via `import.meta.glob`
- Validates extension-to-plugin mapping in the registry

### 3. Environment Configuration
- Validates `.env.example` format and required keys
- Tests URL auto-detection logic (Heroku, Render, Railway, custom domain)
- Validates SQLite database schema creation and migration
- Tests prefix configuration per-guild

### 4. Bot Functionality
- Verifies slash command deployment and registration
- Tests prefix command handling with per-guild prefix
- Validates ticket thread creation and closure
- Confirms moderation command permissions and hierarchy checks

### 5. Message Handler
- Tests message interpolation with `{prefix}` and `{arg}` placeholders
- Verifies message loading from `messages.json`
- Tests fallback for missing message keys
- Validates category-based message grouping

### 6. Message Handler Tests
- Message loading and fallback behavior
- Interpolation of `{prefix}` and `{arg}` placeholders
- Category-based message grouping
- Missing message detection and warnings