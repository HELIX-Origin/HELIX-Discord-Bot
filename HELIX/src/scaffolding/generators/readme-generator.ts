/**
 * Generates comprehensive, educational README.md documentation tailored to each
 * starter template, providing getting-started instructions, architecture overviews,
 * and step-by-step tutorials on building and extending the project.
 */
export function generateProjectReadme(
  templateId: string,
  projectName: string,
  variables: Record<string, string> = {}
): string {
  switch (templateId) {
    case 'discord-bot':
      return `# ${projectName} — Discord.js Starter Bot

> Created with **[HELIX](https://github.com/cli)** using template \`discord-bot\`.

Welcome to your new **Discord.js v14 + TypeScript** bot! This starter template provides a production-ready foundation with slash command handling, dynamic command loading, environment variable management, and automated command deployment.

---

## 📋 Prerequisites

Before running your bot, ensure you have:
1. **Node.js**: \`>= 20.0.0\` installed ([nodejs.org](https://nodejs.org))
2. **Discord Developer Account**: Create an application on the [Discord Developer Portal](https://discord.com/developers/applications).
3. **Bot Token & Client ID**:
   - Go to your application on the Developer Portal.
   - Under **Bot**, click **Reset Token** to copy your \`DISCORD_TOKEN\`.
   - Under **General Information**, copy your **Application ID** as \`CLIENT_ID\`.
   - Under **OAuth2 -> URL Generator**, select \`bot\` and \`applications.commands\` scopes with administrator or desired permissions, and invite the bot to your test server.

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Copy .env.example to .env and fill in your Discord credentials:
cp .env.example .env

# 3. Deploy slash commands to Discord
npm run deploy

# 4. Start the bot in development mode (with hot-reload)
npm run dev
\`\`\`

---

## 📁 Project Directory Structure

\`\`\`text
${projectName}/
├── src/
│   ├── index.ts              # Bot entry point & event interaction router
│   ├── deploy-commands.ts    # REST deployment script for registering slash commands
│   └── commands/             # Slash command definitions
│       ├── ping.ts           # Latency check command example
│       └── info.ts           # Bot metadata command example
├── .env.example              # Environment variable template
├── package.json              # Project dependencies and npm scripts
├── tsconfig.json             # TypeScript compiler options
└── README.md                 # Project documentation & tutorial
\`\`\`

---

## 🛠️ How to Build & Extend this Bot

### Adding a New Slash Command

1. Create a new TypeScript file inside \`src/commands/\` (e.g., \`src/commands/hello.ts\`):

\`\`\`typescript
import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export const helloCommand = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Greets the user!')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to greet')
        .setRequired(false)
    ),
  async execute(interaction: CommandInteraction) {
    const target = (interaction.options as any).getUser('target') || interaction.user;
    await interaction.reply(\`Hello, \${target}! Welcome to the server! 👋\`);
  },
};
\`\`\`

2. Register the new command in \`src/index.ts\` and \`src/deploy-commands.ts\`.
3. Run \`npm run deploy\` to update Discord's application command registry.
4. Test your command inside your Discord server by typing \`/hello\`!

---

## 📦 Production Deployment

\`\`\`bash
# Compile TypeScript to JavaScript in dist/
npm run build

# Start the compiled production bot
npm start
\`\`\`
`;

    case 'web-react':
    case 'web':
      return `# ${projectName} — React 19 + Vite Starter

> Created with **[HELIX](https://github.com/cli)** using template \`${templateId}\`.

Welcome to your **React 19 + TypeScript + Vite** web application! This starter template comes pre-configured with blazing-fast Hot Module Replacement (HMR), TypeScript strict checking, and a component architecture.

---

## 📋 Prerequisites

- **Node.js**: \`>= 20.0.0\` ([nodejs.org](https://nodejs.org))
- **npm** (comes with Node.js) or **pnpm** / **yarn**

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Start the local Vite development server (with instant HMR)
npm run dev

# 3. Open http://localhost:5173 in your browser
\`\`\`

---

## 📁 Project Directory Structure

\`\`\`text
${projectName}/
├── src/
│   ├── main.tsx              # Application root mount point
│   ├── App.tsx               # Main application component & interactive state
│   └── index.css             # Global styles
├── index.html                # HTML5 entry page
├── vite.config.ts            # Vite bundler configuration
├── package.json              # Project dependencies and build scripts
├── tsconfig.json             # TypeScript compiler settings
└── README.md                 # Project guide & tutorial
\`\`\`

---

## 🛠️ How to Build & Extend this Web App

### Creating a New Component

1. Create a new component file (e.g., \`src/components/Card.tsx\`):

\`\`\`tsx
import React from 'react';

interface CardProps {
  title: string;
  description: string;
}

export const Card: React.FC<CardProps> = ({ title, description }) => {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '8px' }}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};
\`\`\`

2. Import and use the component inside \`src/App.tsx\`.

---

## 📦 Production Build

\`\`\`bash
# Type check and bundle optimized production assets into dist/
npm run build

# Preview the production build locally
npm run preview
\`\`\`
`;

    case 'web-vue':
      return `# ${projectName} — Vue 3 + Vite Starter

> Created with **[HELIX](https://github.com/cli)** using template \`web-vue\`.

Welcome to your **Vue 3 Composition API + Pinia + TypeScript + Vite** web application!

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:5173 in your browser
\`\`\`

---

## 📁 Project Structure

\`\`\`text
${projectName}/
├── src/
│   ├── main.ts               # Vue application instance & Pinia plugin setup
│   └── App.vue               # Root Single-File Component (SFC) with <script setup>
├── index.html                # HTML entry point
├── vite.config.ts            # Vite configuration
├── package.json              # Dependencies & scripts
└── tsconfig.json             # TypeScript configuration
\`\`\`

---

## 🛠️ How to Build in this Project

Use Vue 3 Single-File Components with the Composition API (\`<script setup lang="ts">\`):

\`\`\`vue
<script setup lang="ts">
import { ref } from 'vue';

const message = ref('Hello from Vue 3!');
</script>

<template>
  <div>
    <h2>{{ message }}</h2>
  </div>
</template>
\`\`\`
`;

    case 'backend-rust':
      return `# ${projectName} — Rust Web Service

> Created with **[HELIX](https://github.com/cli)** using template \`backend-rust\`.

An asynchronous web microservice built with **Rust + Tokio + Axum + Serde**.

---

## 📋 Prerequisites

- **Rust toolchain & Cargo**: \`>= 1.75\` ([rustup.rs](https://rustup.rs))

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Build and run development server
cargo run

# 2. Test the health check endpoint in another terminal:
curl http://localhost:3000/health
\`\`\`

---

## 🛠️ How to Add a New Route

Open \`src/main.rs\` and add a handler function:

\`\`\`rust
use axum::{routing::post, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct CreateItemRequest {
    name: String,
}

#[derive(Serialize)]
struct ItemResponse {
    id: u64,
    name: String,
}

async fn create_item(Json(payload): Json<CreateItemRequest>) -> Json<ItemResponse> {
    Json(ItemResponse { id: 1, name: payload.name })
}

// In main():
// let app = Router::new()
//     .route("/health", get(health_check))
//     .route("/items", post(create_item));
\`\`\`
`;

    case 'backend-go':
      return `# ${projectName} — Go Web Microservice

> Created with **[HELIX](https://github.com/cli)** using template \`backend-go\`.

A high-performance web service built with **Go 1.22+ standard HTTP router**.

---

## 📋 Prerequisites

- **Go**: \`>= 1.22\` ([go.dev](https://go.dev))

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Run the server
go run cmd/server/main.go

# 2. Verify health check
curl http://localhost:8080/health
\`\`\`
`;

    case 'backend-python':
      return `# ${projectName} — Python FastAPI Service

> Created with **[HELIX](https://github.com/cli)** using template \`backend-python\`.

A modern asynchronous REST API built with **Python 3.11+ + FastAPI + Pydantic + Uvicorn**.

---

## 📋 Prerequisites

- **Python**: \`>= 3.10\` ([python.org](https://python.org))

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Create a virtual environment & install dependencies
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
pip install -r requirements.txt

# 2. Start the development server with auto-reload
uvicorn main:app --reload --port 8000

# 3. Interactive API Documentation
# Open http://localhost:8000/docs in your browser to view the Swagger UI!
\`\`\`
`;

    case 'desktop-tauri':
      return `# ${projectName} — Tauri v2 Desktop App

> Created with **[HELIX](https://github.com/cli)** using template \`desktop-tauri\`.

A cross-platform desktop application powered by **Tauri v2 (Rust backend + Web frontend)**.

---

## 📋 Prerequisites

- **Node.js**: \`>= 20.0.0\`
- **Rust toolchain**: [rustup.rs](https://rustup.rs)
- Platform C++ build tools (Visual Studio on Windows, Xcode CLI on macOS, build-essential on Linux).

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Install frontend dependencies
npm install

# 2. Run the desktop application in development mode
npm run tauri dev
\`\`\`
`;

    case 'desktop-electron':
      return `# ${projectName} — Electron Desktop App

> Created with **[HELIX](https://github.com/cli)** using template \`desktop-electron\`.

A cross-platform desktop application using **Electron + TypeScript + Vite**.

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Start Electron in development mode
npm run dev
\`\`\`
`;

    case 'mobile-flutter':
      return `# ${projectName} — Flutter Mobile App

> Created with **[HELIX](https://github.com/cli)** using template \`mobile-flutter\`.

A cross-platform mobile application built with **Flutter & Dart**.

---

## 📋 Prerequisites

- **Flutter SDK**: \`>= 3.19.0\` ([flutter.dev](https://flutter.dev))

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Fetch Flutter packages
flutter pub get

# 2. Run the app on an emulator or connected device
flutter run
\`\`\`
`;

    case 'mobile-react-native':
      return `# ${projectName} — React Native Mobile App

> Created with **[HELIX](https://github.com/cli)** using template \`mobile-react-native\`.

A cross-platform mobile application powered by **React Native & Expo**.

---

## 🚀 Quick Start Guide

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Start Expo development server
npx expo start
\`\`\`
`;

    case 'game-godot':
      return `# ${projectName} — Godot 4 Game Project

> Created with **[HELIX](https://github.com/cli)** using template \`game-godot\`.

A 2D/3D starter project for **Godot Engine 4.x** with GDScript player controller and scene configuration.

---

## 🚀 Getting Started

1. Download and launch **Godot Engine 4.x** ([godotengine.org](https://godotengine.org)).
2. Click **Import** in the Godot Project Manager.
3. Select the \`project.godot\` file in this directory and click **Import & Edit**.
4. Press **F5** to run the project!
`;

    case 'game-unity':
      return `# ${projectName} — Unity C# Project

> Created with **[HELIX](https://github.com/cli)** using template \`game-unity\`.

A starter assembly and script architecture for **Unity Engine**.

---

## 🚀 Getting Started

1. Open **Unity Hub** and click **Add project from disk**.
2. Select this project root folder.
3. Open the project with Unity 2022.3 LTS or newer!
`;

    case 'game-rpgm':
      return `# ${projectName} — RPG Maker MZ Plugin

> Created with **[HELIX](https://github.com/cli)** using template \`game-rpgm\`.

A modular plugin and configuration for **RPG Maker MZ/MV**.

---

## 🚀 Getting Started

1. Copy \`js/plugins/${projectName}.js\` into your RPG Maker MZ project's \`js/plugins/\` directory.
2. Open the **Plugin Manager** in RPG Maker MZ (F10).
3. Add and enable the plugin!
`;

    case 'game-renpy':
      return `# ${projectName} — Ren'Py Visual Novel Script

> Created with **[HELIX](https://github.com/cli)** using template \`game-renpy\`.

A visual novel starter project for the **Ren'Py Visual Novel Engine**.

---

## 🚀 Getting Started

1. Download the **Ren'Py Launcher** ([renpy.org](https://renpy.org)).
2. Set your projects directory to the parent of this folder.
3. Select \`${projectName}\` in the launcher and click **Launch Project**!
`;

    default:
      return `# ${projectName}

> Created with **[HELIX](https://github.com/cli)** using template \`${templateId}\`.

## 🚀 Getting Started

Follow the setup and build instructions defined in your project configuration.
`;
  }
}
