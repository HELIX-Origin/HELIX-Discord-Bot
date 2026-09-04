import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { AuthResolver } from '../../../src/core/auth/index.js';
import { RepoManager } from '../../../src/core/hosting/index.js';
import { BotDatabase } from '../db/index.js';
import { getAllModels, getFreeModels } from '../ai/models.js';

export const statusCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-status')
    .setDescription('Report status of AI agents, code hosting CLIs, SQLite database, and system health'),

  async execute(interaction: ChatInputCommandInteraction) {
    const aiStatuses = AuthResolver.resolveAll();
    const repoStatuses = RepoManager.checkAll();
    const dbStats = BotDatabase.getInstance().getStats();
    const allModels = getAllModels();
    const freeModels = getFreeModels();

    const aiField = aiStatuses
      .map(s => `${s.authenticated ? '✅' : '❌'} **${s.displayName}**: ${s.authenticated ? s.source : 'Not logged in'}`)
      .join('\n');

    const repoField = repoStatuses
      .map(s => `${s.authenticated ? '✅' : '❌'} **${s.name}**: ${s.authenticated ? 'Ready' : 'Not configured'}`)
      .join('\n');

    const dbField = `${dbStats.exists ? '✅ Connected' : '⚠️ Missing'} • ${Math.round(dbStats.sizeBytes / 1024)} KB\n` +
      `Queries Logged: **${dbStats.queryCount}** | Scaffolds: **${dbStats.scaffoldCount}**`;

    const engineField = `✅ **In-Process Gateway Active** (Zero CLI Subprocesses)\n` +
      `AI Models Registered: **${allModels.length}** (**${freeModels.length}** Community Free Tier, **${allModels.length - freeModels.length}** Flagship Pro)`;

    const embed = new EmbedBuilder()
      .setTitle('📊 HELIX System & Database Diagnostics')
      .setColor(0x00ffc8)
      .addFields(
        { name: '🤖 AI Agent Providers', value: aiField || 'None', inline: false },
        { name: '⚡ Bot AI & Interaction Engine', value: engineField, inline: false },
        { name: '💾 Internal SQLite Database', value: dbField, inline: false },
        { name: '🐙 Code Hosting Tools', value: repoField || 'None', inline: false },
        { name: 'Host Architecture', value: `Node ${process.version} on ${process.platform}`, inline: true },
        { name: 'HELIX Version', value: '0.1.0', inline: true }
      )
      .setFooter({ text: 'HELIX • Autonomous Discord Bot Gateway' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
