# HELIX CLI - Phase 3: Project Type Generators & Multi-Framework Template System

## Goals & Objectives
Implement concrete project scaffolding generators for all supported domains, languages, frameworks, and game engines using the YML template catalog.

## Generators to Implement

### 1. Discord Bot Generator
- **Stack**: TypeScript, discord.js v14
- **Features**: Slash commands (`/ping`, `/info`), event handlers (`ready`, `interactionCreate`), gateway intent configuration, `.env` file generation.

### 2. Web Application Generators
- **React**: Vite + React 19 + TypeScript + Tailwind CSS option.
- **Vue 3**: Vite + Vue 3 + TypeScript + Pinia.
- **Svelte**: Vite + Svelte 5 + TypeScript.
- **Angular**: Angular standalone components template.

### 3. Desktop Application Generators
- **Electron**: Vite + Electron + TypeScript + secure context isolation preload.
- **Tauri v2**: Tauri CLI + Rust backend + Vite frontend.

### 4. Mobile Application Generators
- **Flutter**: Clean directory layout + Riverpod counter starter.
- **React Native / Expo**: Expo Router tabs starter with TypeScript.

### 5. Game Engine Generators
- **Unity**: Standard folder hierarchy (`Assets/Scripts`, `Scenes`, `Prefabs`) + C# assembly definition + starter player controller.
- **Godot 4**: `project.godot` manifest + 2D character controller GDScript + starter scene `.tscn`.
- **RPG Maker MZ**: Plugin template with structured JSDoc header, plugin parameters, and command hooks.
- **Ren'Py**: Visual novel skeleton with `game/script.rpy`, character declarations, dialogue branching, and Python item state.

### 6. Backend Services Generators
- **Rust**: Cargo binary with Axum HTTP server and Tokio runtime.
- **Go**: Standard Go layout (`cmd/server`, `internal/`) with Go 1.22+ `http.ServeMux`.
- **Java**: Maven + Spring Boot 3 + Java 21 REST endpoint starter.
- **Python**: Modern `uv init` + FastAPI + Pydantic v2 + ruff configuration.

## Tasks & Deliverables
- [x] Connect `helix create` command to load corresponding `.yml` template from `.agents/templates/`.
- [x] Execute template pre-hooks and post-hooks (e.g. `npm install`, `cargo check`, `flutter pub get`).
- [x] Implement git repository initialization (`git init` with proper `.gitignore`).
- [x] Add post-scaffold summary banner showing next steps to launch the project.

## Completion Criteria
- Creating each of the 14 project templates produces a runnable, syntax-valid project in an isolated directory.
