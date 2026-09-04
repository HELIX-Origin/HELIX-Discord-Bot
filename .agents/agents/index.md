# Agents Index

This directory contains specialized agent files for each domain and project type supported by HELIX. Each agent definition details domain architecture, directory layout, command scaffolding, environment configurations, and integration guidelines.

## Available Agents

### Project Type Agents

| Agent | Target Frameworks / Languages | Description | Agent File |
|-------|-------------------------------|-------------|------------|
| **discord-bot** | discord.js, TypeScript | Discord bot architecture with slash commands, events, gateway intents, and handlers | [discord-bot.md](discord-bot.md) |
| **web** | React, Vue, Svelte, Angular, Vite, Next.js | Modern web applications, SPAs, SSR, component design, and build tooling | [web.md](web.md) |
| **desktop** | Electron, Tauri v2 | Cross-platform desktop apps with IPC security, window management, and native system APIs | [desktop.md](desktop.md) |
| **mobile** | Flutter, React Native, Expo | Mobile applications for iOS & Android with native bridge, router, and state management | [mobile.md](mobile.md) |
| **game-engine** | Unity, Godot 4, RPG Maker MZ, Ren'\''Py | Game development across modern 2D/3D engines, visual novels, and plugin scripting | [game-engine.md](game-engine.md) |
| **backend** | Rust, Go, Java, Python | High-performance backend services, CLI tools, REST/gRPC APIs, and concurrency models | [backend.md](backend.md) |

### Platform & Integration Agents

| Agent | Target Platforms | Description | Agent File |
|-------|------------------|-------------|------------|
| **code-hosting** | GitHub (`gh`), GitLab (`glab`), Bitbucket | Remote repository creation, auth discovery, and CI/CD pipelines | [code-hosting.md](code-hosting.md) |

## Usage

When working within a specific project domain, reference the corresponding agent file to guide code generation, dependency installation, configuration files, and testing conventions.
