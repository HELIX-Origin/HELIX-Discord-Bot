import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { HelixBotClient } from '../client.js';
import { BotDatabase } from '../db/index.js';
import { AuthResolver } from '../../../src/core/auth/index.js';
import { RepoManager } from '../../../src/core/hosting/index.js';

export const infoCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-info')
    .setDescription('Show comprehensive system, bot runtime, memory, and database diagnostics'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const bot = HelixBotClient.getInstance();
    const db = BotDatabase.getInstance();
    const dbStats = db.getStats();
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());
    const uptimeFormatted = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`;

    const ping = bot ? bot.getGatewayLatency() : -1;
    const guildCount = bot ? bot.getGuildsCache().length : 0;
    const aiStatuses = AuthResolver.resolveAll();
    const authenticatedAi = aiStatuses.filter(s => s.authenticated).map(s => s.displayName).join(', ') || 'None (Owner Only)';

    const embed = new EmbedBuilder()
      .setTitle('⚡ HELIX Bot & System Diagnostics')
      .setColor(0x00ff88)
      .addFields(
        { name: 'Bot Version', value: '`v0.1.0 (Merged Suite)`', inline: true },
        { name: 'Node.js Version', value: '`' + process.version + '`', inline: true },
        { name: 'Platform / Arch', value: '`' + process.platform + '-' + process.arch + '`', inline: true },
        { name: 'Gateway Latency', value: ping >= 0 ? '`' + ping + ' ms`' : '`Connecting...`', inline: true },
        { name: 'Active Guilds', value: '`' + guildCount + ' server(s)`', inline: true },
        { name: 'Process Uptime', value: '`' + uptimeFormatted + '`', inline: true },
        {
          name: 'Memory Footprint',
          value: `RSS: ${Math.round(mem.rss / 1024 / 1024)} MB | Heap: ${Math.round(mem.heapUsed / 1024 / 1024)} / ${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
          inline: false,
        },
        {
          name: 'SQLite Database Metrics',
          value: `Path: \`${dbStats.dbPath}\`\nSize: ${Math.round(dbStats.sizeBytes / 1024)} KB | Total Queries: ${dbStats.queryCount} | Scaffolds: ${dbStats.scaffoldCount}`,
          inline: false,
        },
        {
          name: 'Active AI Providers',
          value: authenticatedAi,
          inline: false,
        }
      )
      .setFooter({ text: 'HELIX Native Discord Architecture • Zero Subprocesses' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
