import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { AuthResolver } from '../../../src/core/auth/index.js';
import { RepoManager } from '../../../src/core/hosting/index.js';
import { LocalCliRunner } from '../../../src/core/cli/index.js';
import { BotDatabase } from '../db/index.js';

export const statusCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-status')
    .setDescription('Report status of AI agents, code hosting CLIs, SQLite database, and system health'),

  async execute(interaction: ChatInputCommandInteraction) {
    const aiStatuses = AuthResolver.resolveAll();
    const repoStatuses = RepoManager.checkAll();
    const dbStats = BotDatabase.getInstance().getStats();
    const cliStatus = LocalCliRunner.getStatus();

    const aiField = aiStatuses
      .map(s => `${s.authenticated ? '✅' : '❌'} **${s.displayName}**: ${s.authenticated ? s.source : 'Not logged in'}`)
      .join('\n');

    const repoField = repoStatuses
      .map(s => `${s.authenticated ? '✅' : '❌'} **${s.name}**: ${s.authenticated ? 'Ready' : 'Not configured'}`)
      .join('\n');

    const dbField = `${dbStats.exists ? '✅ Connected' : '⚠️ Missing'} • ${Math.round(dbStats.sizeBytes / 1024)} KB\n` +
      `Queries Logged: **${dbStats.queryCount}** | Scaffolds: **${dbStats.scaffoldCount}**`;

    const cliField = `${cliStatus.installed ? '✅ Installed' : '⚠️ Missing'} • \`v${cliStatus.version}\`\n` +
      `Repo: \`${cliStatus.repoUrl}\``;

    const embed = new EmbedBuilder()
      .setTitle('📊 HELIX System & Database Diagnostics')
      .setColor(0x00ffc8)
      .addFields(
        { name: '🤖 AI Agent Providers', value: aiField || 'None', inline: false },
        { name: '🐙 Code Hosting Tools', value: repoField || 'None', inline: false },
        { name: '💾 Internal SQLite Database', value: dbField, inline: false },
        { name: '📦 Local Cloned CLI Host', value: cliField, inline: false },
        { name: 'Host Architecture', value: `Node ${process.version} on ${process.platform}`, inline: true },
        { name: 'HELIX Version', value: '0.1.0', inline: true }
      )
      .setFooter({ text: 'HELIX Code • Discord Gateway & SQLite Engine' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
