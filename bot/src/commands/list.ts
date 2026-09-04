import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { TemplateEngine } from '../../../src/core/scaffolding/template-engine.js';
import { AuthResolver } from '../../../src/core/auth/index.js';
import { RepoManager } from '../../../src/core/hosting/index.js';

export const listCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-list')
    .setDescription('List registered templates, target frameworks, and AI agents')
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('Category to inspect')
        .setRequired(false)
        .addChoices(
          { name: 'all - Everything in HELIX ecosystem', value: 'all' },
          { name: 'templates - Multi-framework templates (14 starters)', value: 'templates' },
          { name: 'agents - AI Agent Integrations', value: 'agents' },
          { name: 'platforms - Code Hosting & CI/CD platforms', value: 'platforms' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString('category') || 'all';
    await interaction.deferReply();

    const embed = new EmbedBuilder()
      .setTitle('🧬 HELIX Ecosystem Catalog')
      .setColor(0x38bdf8)
      .setTimestamp();

    if (category === 'all' || category === 'templates') {
      const templates = TemplateEngine.getAllDefaultTemplates();
      const entries = Object.entries(templates).map(([id, t]) => {
        return `• **\`${id}\`**: ${t.framework || t.project_type} (${t.language})`;
      });

      embed.addFields({
        name: '📦 Multi-Framework Scaffolding Templates (14)',
        value: entries.join('\n'),
        inline: false,
      });
    }

    if (category === 'all' || category === 'agents') {
      const aiStatuses = AuthResolver.resolveAll();
      const aiEntries = aiStatuses.map(a => {
        const icon = a.authenticated ? '✔' : '✖';
        return `• **${a.displayName}**: ${icon} ${a.detail}`;
      });

      embed.addFields({
        name: '🤖 AI Agent Providers',
        value: aiEntries.join('\n'),
        inline: false,
      });
    }

    if (category === 'all' || category === 'platforms') {
      const platforms = RepoManager.checkAll();
      const platEntries = platforms.map(p => {
        const icon = p.authenticated ? '✔' : '○';
        return `• **${p.name}** [\`${p.cliCommand}\`]: ${icon} ${p.authDetail}`;
      });

      embed.addFields({
        name: '🐙 Code Hosting & CI/CD Platforms',
        value: platEntries.join('\n'),
        inline: false,
      });
    }

    embed.setFooter({ text: 'Use /helix-create to scaffold any template • /helix-ai to query AI' });
    await interaction.editReply({ embeds: [embed] });
  },
};
