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
          name: '🤖 `/helix-ai <prompt> [provider]`',
          value: 'Query connected AI agents using your authenticated member session.',
        },
        {
          name: '🔐 `/helix-auth <status|login|logout> [provider] [token]`',
          value: 'Manage your individual user session for AI authentication in this Discord server.',
        },
        {
          name: '💡 `/helix-explain <code> [language]`',
          value: 'Explain complex code snippets, algorithms, or errors with AI guidance.',
        },
        {
          name: '🚀 `/helix-scaffold <type> <name>`',
          value: 'Inspect and preview project starters (Discord, React, Vue, Tauri, Rust, Go, Godot, Python).',
        },
        {
          name: '📊 `/helix-status`',
          value: 'Check health of AI agent providers, platform CLIs (`gh`, `glab`), and system info.',
        },
        {
          name: '🐙 `/helix-repo <action>`',
          value: 'Inspect remote repository status and GitHub/GitLab CLI credentials.',
        }
      )
      .setFooter({ text: 'HELIX CLI • Universal Developer Assistant' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
