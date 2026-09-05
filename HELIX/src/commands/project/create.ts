import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError } from '../../handlers/message-handler.js';
import { getCommandHelpEmbed } from '../../handlers/help-registrar.js';
import { botSettings } from '../../handlers/settings-manager.js';
import type { CommandDefinition } from '../../types/command.js';

const TEMPLATES = [
  { value: 'discord-bot', label: 'Discord Bot (discord.js + TypeScript)' },
  { value: 'web-react', label: 'Web App (React + Vite)' },
  { value: 'web-vue', label: 'Web App (Vue 3 + Vite)' },
  { value: 'desktop-tauri', label: 'Desktop App (Tauri v2)' },
  { value: 'desktop-electron', label: 'Desktop App (Electron)' },
  { value: 'mobile-flutter', label: 'Mobile App (Flutter)' },
  { value: 'mobile-react-native', label: 'Mobile App (React Native)' },
  { value: 'game-unity', label: 'Game (Unity C#)' },
  { value: 'game-godot', label: 'Game (Godot 4)' },
  { value: 'game-rpgm', label: 'Game (RPG Maker MZ)' },
  { value: 'game-renpy', label: 'Visual Novel (Ren\'Py)' },
  { value: 'backend-rust', label: 'Backend (Rust + Tokio)' },
  { value: 'backend-go', label: 'Backend (Go)' },
  { value: 'backend-python', label: 'Backend (Python + FastAPI)' },
];

export const create: CommandDefinition = {
  name: 'create',
  description: 'Scaffold a new project from starter templates',
  category: 'project',
  usage: '<template> <name> [git_platform] [dry_run]',
  examples: ['create discord-bot my-bot', 'create web-react frontend-app github', 'create backend-rust api-service --dry-run'],
  options: [
    { name: 'template', description: 'Template ID', type: 'string', required: true, choices: TEMPLATES.map(t => ({ name: t.label, value: t.value })) },
    { name: 'name', description: 'Project name', type: 'string', required: true },
    { name: 'git_platform', description: 'Git platform', type: 'string', required: false, choices: [{ name: 'GitHub', value: 'github' }, { name: 'GitLab', value: 'gitlab' }, { name: 'Bitbucket', value: 'bitbucket' }] },
    { name: 'dry_run', description: 'Preview without writing files', type: 'boolean', required: false },
  ],
  async execute({ message, interaction, getOption, user, guild }) {
    const template = getOption<string>('template');
    const name = getOption<string>('name');
    const dryRun = getOption<boolean>('dry_run') || false;
    if (!template || !name) {
      const prefix = guild ? botSettings.getPrefix(guild.id) : '>';
      const helpEmbed = getCommandHelpEmbed('create', prefix, {
        missingNotice: 'Please provide both `<template>` and `<name>` to scaffold a project.',
      });
      if (message) return message.reply({ embeds: [helpEmbed!] });
      return interaction!.reply({ embeds: [helpEmbed!], ephemeral: true });
    }

    BotDatabase.getInstance().logScaffold({ userId: user.id, templateId: template, projectName: name });

    const embed = createEmbed('project.create.embed', {
      name,
      template,
      fileCount: dryRun ? 'Preview (0 files written)' : 'Scaffolded successfully',
    });
    if (message) await message.reply({ embeds: [embed] }); else await interaction!.reply({ embeds: [embed] });
  },
};
