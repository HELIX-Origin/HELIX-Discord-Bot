import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-help')
    .setDescription('Explore all HELIX Code and HELIX CLI commands and capabilities'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🧬 HELIX Code & CLI - Developer Assistant')
      .setDescription('HELIX Code integrates universal project generation, AI assistants, and code hosting into your Discord server.')
      .setColor(0x00d2ff)
      .addFields(
        {
          name: '🚀 `/helix-create <template> <name> [git_platform] [dry_run]`',
          value: 'Scaffold any of the 14 multi-framework project blueprints directly in Discord.',
        },
        {
          name: '📚 `/helix-list [category]`',
          value: 'List all available templates, frameworks, AI agents, and code hosting platforms.',
        },
        {
          name: '🤖 `/helix-ai <prompt> [provider]`',
          value: 'Query connected AI agents (owner keys or personal member sessions).',
        },
        {
          name: '🔐 `/helix-auth <status|login|logout> [provider] [token]`',
          value: 'Manage your personal user session for AI authentication in this Discord server.',
        },
        {
          name: '💡 `/helix-explain <code> [language]`',
          value: 'Explain complex code snippets, algorithms, or errors with AI guidance.',
        },
        {
          name: '🐙 `/helix-repo [platform]`',
          value: 'Inspect remote repository status and GitHub/GitLab CLI credentials.',
        },
        {
          name: '📊 `/helix-status`',
          value: 'Check bot gateway, SQLite database, and configuration overview.',
        },
        {
          name: '⚡ `/helix-info`',
          value: 'Full bot runtime diagnostics, memory usage, uptime, and system toolchains.',
        }
      )
      .setFooter({ text: 'HELIX Discord Bot Suite • Full In-Process Developer Engine' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
