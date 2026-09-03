# HELIX CLI - Testing Suite & Verification Infrastructure

This directory houses the automated test suites, fixtures, and mocks used to verify, test, and debug the HELIX CLI tool.

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
│   ├── scaffolding-discord.test.ts # Scaffolding discord bot projects
│   ├── scaffolding-web.test.ts     # Scaffolding React, Vue, Svelte web projects
│   ├── scaffolding-desktop.test.ts # Scaffolding Electron and Tauri projects
│   ├── scaffolding-mobile.test.ts  # Scaffolding Flutter and Expo projects
│   ├── scaffolding-games.test.ts   # Scaffolding Unity, Godot, RPGM, Ren'Py
│   ├── scaffolding-backend.test.ts # Scaffolding Rust, Go, Java, Python
│   └── repo-remote.test.ts         # Remote repository initialization & git remotes
├── fixtures/                 # Static mock environments
│   ├── mock-configs/         # Fake hosts.json, auth.json, and .env files
│   │   ├── github-copilot/
│   │   ├── antigravity/
│   │   └── opencode/
│   ├── mock-templates/       # Sample valid and invalid YAML template files
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

### 2. Multi-Tiered AI Credential Waterfall
- **Priority 1**: Simulates `gh auth token` returning a valid token -> confirms Copilot provider authenticated via client.
- **Priority 2**: Simulates client missing, but `.env` containing `ANTIGRAVITY_API_KEY` -> confirms Antigravity authenticated via `.env`.
- **Priority 3**: Simulates neither present -> confirms graceful degradation without unhandled exceptions.

### 3. Code Hosting CLI Integration
- Simulates presence of `gh` CLI -> confirms `gh repo create` invoked with expected arguments.
- Simulates presence of `glab` CLI -> confirms `glab repo create` invoked with expected arguments.
- Simulates absence of official CLIs -> confirms fallback to standard `git remote add origin`.
