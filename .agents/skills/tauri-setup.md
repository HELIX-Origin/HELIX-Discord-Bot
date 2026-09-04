# Skill: Tauri v2 Setup & Architecture

## Overview
Standards and best practices for developing lightweight, secure cross-platform desktop applications using Tauri v2 (Rust backend) and modern web frontends (Vite/TypeScript).

## Prerequisites
- Rust & Cargo installed (`rustup`)
- Platform C++ build tools (Visual Studio C++ build tools on Windows, Xcode on macOS, build-essential on Linux)
- Node.js 18+

## Project Initialization
```bash
npm create tauri-app@latest
# Choose project name, frontend recipe (Vite + React/Vue/Svelte + TypeScript)
cd my-tauri-app
npm install
npm run tauri dev
```

## Tauri Command Recipe (`src-tauri/src/lib.rs`)
```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Frontend Invocation (`src/App.tsx`)
```typescript
import { invoke } from '@tauri-apps/api/core';

async function handleGreet() {
  const message = await invoke<string>('greet', { name: 'Developer' });
  console.log(message);
}
```
