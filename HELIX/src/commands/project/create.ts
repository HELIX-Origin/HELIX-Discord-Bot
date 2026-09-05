import { AttachmentBuilder } from 'discord.js';
import { BotDatabase } from '../../db/database.js';
import { createEmbed, formatError } from '../../handlers/message-handler.js';
import { getCommandHelpEmbed } from '../../handlers/help-registrar.js';
import { botSettings } from '../../handlers/settings-manager.js';
import { executeScaffold } from '../../scaffolding/scaffold.js';
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
  description: 'Scaffold a new project from starter templates and receive an archive download',
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
    const gitPlatform = getOption<string>('git_platform') || 'none';
    const dryRun = getOption<boolean>('dry_run') || false;

    if (!template || !name) {
      const prefix = guild ? botSettings.getPrefix(guild.id) : '>';
      const helpEmbed = getCommandHelpEmbed('create', prefix, {
        missingNotice: 'Please provide both `<template>` and `<name>` to scaffold a project.',
      });
      if (message) return message.reply({ embeds: [helpEmbed!] });
      return interaction!.reply({ embeds: [helpEmbed!], ephemeral: true });
    }

    const type = template.startsWith('web-') ? 'web' :
      template.startsWith('desktop-') ? 'desktop' :
      template.startsWith('mobile-') ? 'mobile' :
      template.startsWith('game-') ? 'game-engine' :
      template.startsWith('backend-') ? 'backend' : 'discord-bot';

    const result = await executeScaffold(
      type,
      name,
      {
        PROJECT_NAME: name,
        AUTHOR: (user as any)?.username || 'User',
        DESCRIPTION: `Scaffolded via HELIX for ${(user as any)?.username || 'User'}`,
        DISCORD_TOKEN: 'your_bot_token_here',
        CLIENT_ID: 'your_client_id_here',
        GUILD_ID: guild?.id || 'your_guild_id_here',
      },
      {
        template,
        gitPlatform: gitPlatform as any,
        dryRun,
        skipGit: true,
        skipInstall: true,
        writeToDisk: false,
      }
    );

    if (!result.success) {
      const errEmbed = formatError('Missing required template variables or unrecognized template.');
      if (message) return message.reply({ embeds: [errEmbed] });
      return interaction!.reply({ embeds: [errEmbed], ephemeral: true });
    }

    if (dryRun) {
      const manifestList = result.writtenFiles.slice(0, 15).map(f => `• \`${f.replace(/\\/g, '/')}\``).join('\n') +
        (result.writtenFiles.length > 15 ? `\n... and ${result.writtenFiles.length - 15} more files` : '');

      const previewEmbed = createEmbed('project.create.preview_embed', {
        name,
        template,
        fileCount: String(result.writtenFiles.length),
        manifest: manifestList || '• Baseline project files',
      });

      if (message) return message.reply({ embeds: [previewEmbed] });
      return interaction!.reply({ embeds: [previewEmbed] });
    }

    const db = BotDatabase.getInstance();
    const scaffoldId = db.saveScaffold({
      userId: user?.id,
      guildId: guild?.id,
      templateId: template,
      projectName: name,
      files: result.files,
      archiveBuffer: result.archiveBuffer,
    });

    const embed = createEmbed('project.create.embed', {
      name,
      template,
      fileCount: String(result.files.length),
      archiveName: `${name}.zip`,
      scaffoldId: scaffoldId ? `#${scaffoldId}` : 'Saved',
    });

    const filesToSend = result.archiveBuffer
      ? [new AttachmentBuilder(result.archiveBuffer, { name: `${name}.zip`, description: `HELIX Scaffold Archive: ${name}` })]
      : [];

    if (message) {
      await message.reply({ embeds: [embed], files: filesToSend });
    } else {
      await interaction!.reply({ embeds: [embed], files: filesToSend });
    }
  },
};
