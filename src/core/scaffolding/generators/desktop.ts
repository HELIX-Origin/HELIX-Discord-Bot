import { FileToGenerate } from '../file-generator.js';

export function generateDesktopFiles(
  projectName: string,
  framework: 'electron' | 'tauri',
  variables: Record<string, string>
): FileToGenerate[] {
  if (framework === 'tauri') {
    const windowTitle = variables.WINDOW_TITLE || `${projectName} Desktop`;
    const identifier = variables.IDENTIFIER || `com.helix.${projectName.toLowerCase()}`;

    return [
      {
        relativePath: 'src-tauri/Cargo.toml',
        content: `[package]
name = "${projectName.toLowerCase()}"
version = "0.1.0"
description = "A Tauri App created with HELIX CLI"
authors = ["HELIX CLI"]
edition = "2021"

[lib]
name = "${projectName.toLowerCase()}_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.0.0", features = [] }

[dependencies]
tauri = { version = "2.0.0", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`,
      },
      {
        relativePath: 'src-tauri/tauri.conf.json',
        content: JSON.stringify(
          {
            $schema: 'https://schema.tauri.app/config/2',
            productName: projectName,
            version: '0.1.0',
            identifier,
            build: {
              beforeDevCommand: 'npm run dev',
              devUrl: 'http://localhost:5173',
              beforeBuildCommand: 'npm run build',
              frontendDist: '../dist',
            },
            app: {
              windows: [
                {
                  title: windowTitle,
                  width: 1024,
                  height: 768,
                },
              ],
              security: {
                csp: null,
              },
            },
          },
          null,
          2
        ) + '\n',
      },
      {
        relativePath: 'src-tauri/src/main.rs',
        content: `// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`,
      },
      {
        relativePath: 'package.json',
        content: JSON.stringify(
          {
            name: projectName,
            version: '0.1.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'tsc && vite build',
              'tauri:dev': 'tauri dev',
              'tauri:build': 'tauri build',
            },
            dependencies: {
              '@tauri-apps/api': '^2.0.0',
              react: '^19.0.0',
              'react-dom': '^19.0.0',
            },
            devDependencies: {
              '@tauri-apps/cli': '^2.0.0',
              '@vitejs/plugin-react': '^4.3.1',
              typescript: '^5.4.5',
              vite: '^5.3.1',
            },
          },
          null,
          2
        ) + '\n',
      },
      {
        relativePath: 'src/App.tsx',
        content: `import React from 'react';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Welcome to ${projectName} (Tauri v2 + Rust)</h1>
      <p>Blazing fast native desktop application built with HELIX CLI.</p>
    </div>
  );
}
`,
      },
    ];
  }

  // Default: Electron with Context Isolation
  return [
    {
      relativePath: 'package.json',
      content: JSON.stringify(
        {
          name: projectName,
          version: '0.1.0',
          main: 'dist-electron/main.js',
          type: 'module',
          scripts: {
            dev: 'tsx watch src/main/index.ts',
            build: 'tsc && electron-builder',
          },
          devDependencies: {
            electron: '^30.0.9',
            'electron-builder': '^24.13.3',
            tsx: '^4.15.0',
            typescript: '^5.4.5',
          },
        },
        null,
        2
      ) + '\n',
    },
    {
      relativePath: 'src/main/index.ts',
      content: `import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL('data:text/html,<html><body style="font-family:system-ui;padding:2rem;"><h1>${projectName}</h1><p>Electron Desktop Application (HELIX CLI)</p></body></html>');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`,
    },
    {
      relativePath: 'src/preload/index.ts',
      content: `import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
});
`,
    },
  ];
}
