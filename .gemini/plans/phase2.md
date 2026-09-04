# HELIX CLI - Phase 2: TypeScript CLI Architecture & Scaffolding Engine

## Goals & Objectives
Build the core TypeScript CLI application structure, command parsing runtime, interactive prompt system, and atomic scaffolding engine.

## Architectural Specification

### 1. Package & Build Architecture
```
HELIX CLI/
├── bin/
│   └── helix.js              # Executable entry point with #!/usr/bin/env node
├── src/
│   ├── index.ts              # Program entry & command registration
│   ├── cli.ts                # Command router and global options
│   ├── commands/             # Subcommand implementations
│   │   ├── create.ts         # Project scaffolding command
│   │   ├── list.ts           # List agents/skills/templates
│   │   ├── ai.ts             # AI agent inspection & testing
│   │   └── info.ts           # System & diagnostic info
│   ├── core/                 # Core engine services
│   │   ├── template-engine.ts# Variable substitution & template parser
│   │   ├── file-generator.ts # Atomic disk writer & directory creator
│   │   ├── package-runner.ts # npm/cargo/flutter/go package runner
│   │   └── auth-resolver.ts  # Multi-tiered credential discovery
│   ├── config/               # Schema definitions and defaults
│   └── utils/                # Loggers, spinner, terminal styling
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### 2. CLI Command Syntax
```bash
helix create <project-type> <project-name> [options]

Options:
  -t, --template <name>       Template name (e.g., discord-bot, web-react, game-unity)
  -l, --language <lang>       Language override (typescript, rust, go, python, csharp)
  -f, --framework <framework> Framework override (react, vue, svelte, fastapi)
  --skip-install              Skip automatic dependency installation
  --skip-git                  Skip git initialization
  --dry-run                   Preview files that will be generated without writing to disk
```

## Tasks & Deliverables
- [x] Initialize `package.json` with ESM configuration, TypeScript, `commander`, `picocolors`, `ora`, and `yaml`.
- [x] Set up `tsconfig.json` with strict typechecking and NodeNext module resolution.
- [x] Build `TemplateEngine` supporting `${VARIABLE_NAME}` substitution and conditional blocks.
- [x] Implement atomic file writing to prevent partial project generation upon error.
- [x] Add interactive prompts when arguments are omitted in interactive TTY sessions.

## Completion Criteria
- Running `helix --help` prints available commands and options.
- Running `helix create <type> <name> --dry-run` displays accurate file creation tree without touching filesystem.