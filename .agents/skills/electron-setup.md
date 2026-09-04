# Skill: Electron Setup & Secure Architecture

## Overview
Standards and code recipes for creating cross-platform desktop applications with Electron, Vite, TypeScript, and strict IPC security.

## Core Architectural Rules
1. **Never allow Node.js integration** in the renderer (`nodeIntegration: false`).
2. **Always isolate contexts** (`contextIsolation: true`).
3. **Use explicit Preload APIs** with `contextBridge.exposeInMainWorld()`.
4. **Validate IPC messages** with type safety and schema validation.

## Main Process Bootstrap (`src/main/index.ts`)
```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

ipcMain.handle('app:version', () => app.getVersion());
```

## Preload Bridge (`src/preload/index.ts`)
```typescript
import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
}

const api: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke('app:version'),
};

contextBridge.exposeInMainWorld('electron', api);
```
