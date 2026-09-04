import { getPrefixForGuild } from '../../handlers/command-handler.js';
import { createEmbed } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

const templates = [
  '• `web-react` — React 19 + Vite (TypeScript)',
  '• `web-vue` — Vue 3 + Vite (TypeScript)',
  '• `web-app` — Vanilla HTML5/CSS/JS + Vite',
  '• `discord-bot` — discord.js v14 (TypeScript)',
  '• `desktop-electron` — Electron (TypeScript)',
  '• `desktop-tauri` — Tauri v2 (Rust + TypeScript)',
  '• `mobile-flutter` — Flutter + Riverpod (Dart)',
  '• `mobile-react-native` — Expo Router (TypeScript)',
  '• `backend-rust` — Axum + Tokio (Rust)',
  '• `backend-go` — net/http (Go)',
  '• `backend-java` — Spring Boot 3 (Java 21)',
  '• `backend-python` — FastAPI + uv (Python)',
  '• `game-godot` — Godot 4 (GDScript)',
  '• `game-unity` — Unity LTS (C#)',
  '• `game-rpgm` — RPG Maker MZ/MV (JavaScript)',
  '• `game-renpy` — Ren\'Py (Python)',
];

export const list: CommandDefinition = {
  name: 'list',
  description: 'List available project scaffolding templates',
  category: 'info',
  async execute({ message, interaction, guild }) {
    const prefix = getPrefixForGuild(guild?.id || '');
    const embed = createEmbed('info.list.embed', {
      prefix,
      templatesList: templates.join('\n'),
    });

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });
  },
};
