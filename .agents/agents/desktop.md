# Desktop App Development Agent

This agent provides conventions, architecture, and workflow standards for building cross-platform desktop applications using **Electron** and **Tauri v2**.

## Architecture & Structure

### Option A: Electron (TypeScript + Vite)
```
desktop-electron/
├── src/
│   ├── main/                 # Node.js main process
│   │   ├── index.ts          # Window creation & lifecycle
│   │   └── ipc/              # IPC handlers
│   ├── preload/              # Secure preload script
│   │   └── index.ts          # contextBridge APIs
│   └── renderer/             # Frontend UI (React/Vue/Svelte)
│       ├── src/
│       └── index.html
├── electron-builder.yml      # Native packaging config
├── package.json
├── tsconfig.json
└── README.md
```

### Option B: Tauri v2 (Rust + Vite)
```
desktop-tauri/
├── src-tauri/                # Rust backend
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json       # Tauri window & capability permissions
│   └── src/
│       ├── main.rs
│       └── lib.rs            # Custom Tauri command handlers
├── src/                      # Frontend UI (React/Vue/Svelte/Vanilla)
├── package.json
└── README.md
```

## Scaffolding & Setup Commands

```bash
# Electron project
helix create desktop-app my-electron --template desktop-electron
npm install
npm run dev

# Tauri project
helix create desktop-app my-tauri --template desktop-tauri
npm install
npm run tauri dev
```

## Security & Architectural Guidelines

### Electron Security Principles
1. **Disable Node Integration**: Always set `nodeIntegration: false` in `webPreferences`.
2. **Context Isolation**: Always enable `contextIsolation: true`.
3. **Preload Whitelisting**: Expose only explicit, validated channels to the renderer via `contextBridge.exposeInMainWorld()`.
4. **Navigation Restrictions**: Validate all outbound navigation requests in `will-navigate` and `setWindowOpenHandler`.

### Tauri Security Principles
1. **Capability Permissions**: Define precise allowed commands in `src-tauri/capabilities/default.json`.
2. **IPC Validation**: Tauri commands in Rust must strictly deserialize and validate arguments using `serde`.
