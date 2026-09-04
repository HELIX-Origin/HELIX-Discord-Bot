# Scaffolding Templates

Use `>create <type> <name>` to scaffold a project, or `>scaffold <type>` to preview the file tree.

| Template ID | Domain | Framework / Language |
|-------------|--------|----------------------|
| `discord-bot` | Discord | discord.js v14 · TypeScript |
| `web-react` | Web | React 19 + Vite · TypeScript |
| `web-vue` | Web | Vue 3 + Vite · TypeScript |
| `web-app` | Web | Vanilla HTML/CSS/JS + Vite |
| `desktop-electron` | Desktop | Electron (context isolation) · TypeScript |
| `desktop-tauri` | Desktop | Tauri v2 · Rust + TypeScript |
| `desktop-app` | Desktop | Electron (minimal) · TypeScript |
| `mobile-flutter` | Mobile | Flutter + Riverpod · Dart |
| `mobile-react-native` | Mobile | Expo Router · TypeScript |
| `game-unity` | Game Engine | Unity LTS · C# |
| `game-godot` | Game Engine | Godot 4 · GDScript |
| `game-rpgm` | Game Engine | RPG Maker MZ/MV · JavaScript |
| `game-renpy` | Game Engine | Ren'\''Py · Python |
| `backend-rust` | Backend | Axum + Tokio · Rust |
| `backend-go` | Backend | net/http · Go |
| `backend-java` | Backend | Spring Boot 3 · Java 21 |
| `backend-python` | Backend | FastAPI + uv · Python |

Template definitions live in `.agents/templates/` as YML files. The scaffolding engine (`HELIX/src/scaffolding/template-engine.ts`) handles variable substitution and binary file preservation.
