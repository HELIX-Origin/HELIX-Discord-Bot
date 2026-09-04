import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { TemplateEngine } from '../../../src/core/scaffolding/template-engine.js';
import { FileGenerator } from '../../../src/core/scaffolding/file-generator.js';
import { getDomainFiles } from '../../../src/core/scaffolding/generators/index.js';
import { BotDatabase } from '../db/index.js';

export const createCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-create')
    .setDescription('Scaffold a new project blueprint across 14 multi-framework templates')
    .addStringOption(option =>
      option
        .setName('template')
        .setDescription('Target project framework template')
        .setRequired(true)
        .addChoices(
          { name: 'Discord Bot (discord.js + TS)', value: 'discord-bot' },
          { name: 'Web React (React 19 + Vite)', value: 'web-react' },
          { name: 'Web Vue (Vue 3 + Vite)', value: 'web-vue' },
          { name: 'Desktop Tauri (Tauri v2 + Rust)', value: 'desktop-tauri' },
          { name: 'Desktop Electron (TypeScript)', value: 'desktop-electron' },
          { name: 'Mobile Flutter (Riverpod)', value: 'mobile-flutter' },
          { name: 'Mobile Expo (React Native)', value: 'mobile-react-native' },
          { name: 'Game Unity (C#)', value: 'game-unity' },
          { name: 'Game Godot 4 (GDScript)', value: 'game-godot' },
          { name: 'Game RPG Maker MZ (Plugin)', value: 'game-rpgm' },
          { name: 'Game Ren\'Py (Visual Novel)', value: 'game-renpy' },
          { name: 'Backend Rust (Axum)', value: 'backend-rust' },
          { name: 'Backend Go (Standard Layout)', value: 'backend-go' },
          { name: 'Backend Python (FastAPI + uv)', value: 'backend-python' }
        )
    )
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Project directory name')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('git_platform')
        .setDescription('CI/CD pipeline and code hosting platform')
        .setRequired(false)
        .addChoices(
          { name: 'GitHub Actions', value: 'github' },
          { name: 'GitLab CI', value: 'gitlab' },
          { name: 'Bitbucket Pipelines', value: 'bitbucket' },
          { name: 'None (skip CI/CD)', value: 'none' }
        )
    )
    .addBooleanOption(option =>
      option
        .setName('dry_run')
        .setDescription('Preview blueprint manifest without logging scaffold record')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const templateId = interaction.options.getString('template', true);
    const projectName = interaction.options.getString('name', true).replace(/[^a-zA-Z0-9-_]/g, '-');
    const gitPlatform = (interaction.options.getString('git_platform') || 'none') as any;
    const dryRun = interaction.options.getBoolean('dry_run') || false;

    await interaction.deferReply();

    const template = TemplateEngine.getDefaultTemplate(templateId);
    if (!template) {
      await interaction.editReply({ content: `❌ Template \`${templateId}\` not recognized.` });
      return;
    }

    const baselineFiles = FileGenerator.getBaselineFiles(projectName, templateId);
    const domainFiles = getDomainFiles(templateId, projectName, template, {}, gitPlatform);
    const allFiles = [...baselineFiles, ...domainFiles];

    if (!dryRun) {
      BotDatabase.getInstance().logScaffold({
        userId: interaction.user.id,
        templateId,
        projectName,
      });
    }

    const fileListSnippet = allFiles
      .slice(0, 10)
      .map(f => `  + ${f.relativePath}`)
      .join('\n');
    const moreFiles = allFiles.length > 10 ? `\n  ... and ${allFiles.length - 10} more files` : '';

    const embed = new EmbedBuilder()
      .setTitle(`🚀 HELIX Project Scaffolding: ${projectName}`)
      .setDescription(
        `Generated blueprint for **${projectName}** using template **${templateId}** (${template.framework || template.project_type} / ${template.language}).`
      )
      .setColor(0x00d2ff)
      .addFields(
        { name: 'Framework', value: `\`${template.framework || template.project_type}\``, inline: true },
        { name: 'Language', value: `\`${template.language}\``, inline: true },
        { name: 'Total Files', value: `\`${allFiles.length} files\``, inline: true },
        {
          name: 'Generated Manifest',
          value: '```text\n' + fileListSnippet + moreFiles + '\n```',
        },
        {
          name: 'Getting Started Commands',
          value:
            '```bash\n# 1. Setup & Install Dependencies\n' +
            (template.setup_command || '# No setup required') +
            '\n\n# 2. Run in Development\n' +
            (template.run_command || '# See README.md') +
            '\n\n# 3. Build for Production\n' +
            (template.build_command || '# See README.md') +
            '\n```',
        }
      )
      .setFooter({ text: dryRun ? 'Preview Mode (Dry-Run)' : 'Scaffolded via HELIX Discord Bot Engine' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
