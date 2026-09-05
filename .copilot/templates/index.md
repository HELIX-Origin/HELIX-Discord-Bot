# Templates Index

This directory contains reusable Markdown template definitions and engineering guides for HELIX CLI and Discord Bot project generation.

## Available Templates

| Template ID | Domain | Framework / Engine | Language | Template File |
|-------------|--------|--------------------|----------|---------------|
| **discord-bot** | Discord | discord.js | TypeScript | [discord-bot.md](discord-bot.md) |
| **web-react** | Web | React 19 + Vite | TypeScript | [web-react.md](web-react.md) |
| **web-vue** | Web | Vue 3 + Vite | TypeScript | [web-vue.md](web-vue.md) |
| **web-app** | Web | Vanilla + Vite | TypeScript | [web-app.md](web-app.md) |
| **desktop-electron** | Desktop | Electron + Vite | TypeScript | [desktop-electron.md](desktop-electron.md) |
| **desktop-tauri** | Desktop | Tauri v2 | Rust + TypeScript | [desktop-tauri.md](desktop-tauri.md) |
| **desktop-app** | Desktop | Multi-target | TypeScript | [desktop-app.md](desktop-app.md) |
| **mobile-flutter** | Mobile | Flutter | Dart | [mobile-flutter.md](mobile-flutter.md) |
| **mobile-react-native** | Mobile | Expo / React Native | TypeScript | [mobile-react-native.md](mobile-react-native.md) |
| **game-unity** | Game Engine | Unity LTS | C# | [game-unity.md](game-unity.md) |
| **game-godot** | Game Engine | Godot 4 | GDScript | [game-godot.md](game-godot.md) |
| **game-rpgm** | Game Engine | RPG Maker MZ/MV | JavaScript | [game-rpgm.md](game-rpgm.md) |
| **game-renpy** | Game Engine | Ren'\''Py | Python | [game-renpy.md](game-renpy.md) |
| **backend-rust** | Backend | Axum + Tokio | Rust | [backend-rust.md](backend-rust.md) |
| **backend-go** | Backend | Go Net/HTTP | Go | [backend-go.md](backend-go.md) |
| **backend-java** | Backend | Spring Boot 3 | Java 21 | [backend-java.md](backend-java.md) |
| **backend-python** | Backend | FastAPI + uv | Python | [backend-python.md](backend-python.md) |
| **mermaid-guide** | Standards | Mermaid Diagrams | Markdown | [mermaid-diagram-guide.md](mermaid-diagram-guide.md) |
| **commit-guide** | Standards | Commit & PR Message Conventions | Markdown | [commit-message-guide.md](commit-message-guide.md) |

---

## Template Schema Specification

Every template Markdown file starts with YAML frontmatter containing runtime metadata, followed by detailed repository layout, development scripts, and architectural code boilerplate:

```yaml
---
id: <string>                 # Unique template identifier
name: <string>               # Human-readable title
domain: <string>             # Category: discord-bot, web, desktop, mobile, game-engine, backend
framework: <string>          # Framework or runtime
language: <string>           # Primary programming language
setup_command: <string>      # Shell command executed after scaffolding
run_command: <string>        # Command to start the development server
build_command: <string>      # Command to compile / package the project
variables:                   # Dynamic interpolation variables
  - name: <string>           # Variable identifier
    description: <string>    # Explanatory description
    required: <boolean>      # Mandatory or optional
    default: <string>        # Fallback value
---
```
