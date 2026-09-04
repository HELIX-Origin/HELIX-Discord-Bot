import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BotDatabase } from '../db/index.js';
import { TemplateEngine } from '../../../src/core/scaffolding/template-engine.js';

export const scaffoldCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-scaffold')
    .setDescription('Preview or plan scaffolding for a new project')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Project template type')
        .setRequired(true)
        .addChoices(
          { name: 'Discord Bot (discord.js)', value: 'discord-bot' },
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
          { name: 'Backend Go (Net/HTTP)', value: 'backend-go' },
          { name: 'Backend Python (FastAPI)', value: 'backend-python' }
        )
    )
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Project directory name')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const templateType = interaction.options.getString('type', true);
    const projectName = interaction.options.getString('name', true);

    // Record scaffolding to internal SQLite database
    BotDatabase.getInstance().logScaffold({
      userId: interaction.user.id,
      templateId: templateType,
      projectName,
    });

    const template = TemplateEngine.getDefaultTemplate(templateType);
    const framework = template ? (template.framework || template.project_type) : templateType;
    const language = template ? template.language : 'TypeScript';

    const embed = new EmbedBuilder()
      .setTitle(`🚀 HELIX Scaffolding Plan: ${projectName}`)
      .setDescription(`Prepared starter blueprint for **${projectName}** using template **${templateType}**.`)
      .setColor(0x7289da)
      .addFields(
        { name: 'Template ID', value: `\`${templateType}\``, inline: true },
        { name: 'Framework', value: `\`${framework}\``, inline: true },
        { name: 'Language', value: `\`${language}\``, inline: true },
        {
          name: 'Generate Blueprint in Discord',
          value: `Use \`/helix-create template:${templateType} name:${projectName}\` to generate the complete file manifest and starter code.`,
          inline: false,
        }
      )
      .setFooter({ text: 'HELIX • In-Process Project Scaffolder' });

    await interaction.reply({ embeds: [embed] });
  },
};
