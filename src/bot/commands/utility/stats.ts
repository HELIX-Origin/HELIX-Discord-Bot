import { type AppDeps } from '../../../app.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { type ApplicationCommand, type DiscordInteraction, type InteractionResponse } from '../../utils/types.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';

export const statsCommandDef: ApplicationCommand = {
  name: 'stats',
  description: 'View bot statistics, service status, and dashboard info',
};

export async function handleStatsCommand(interaction: DiscordInteraction, deps: AppDeps): Promise<InteractionResponse> {
  const stats = deps.db.stats();
  const uptimeSec = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

  const guildId = interaction.guild_id;
  let guildFeedsCount = 0;
  if (guildId) {
    const user = deps.repo.getOrCreateGuildUser(guildId);
    guildFeedsCount = deps.repo.listFeeds(user.id).length;
  }

  const inviteUrl = deps.config.redirectUrl || 'Not configured';
  const dashboardUrl = deps.config.publicBaseUrl || deps.config.internalUrl;

  return EmbedHandler.for(deps)
    .primary()
    .title('Service Status', '📊')
    .field('📡 This Server', `**Feeds:** ${guildFeedsCount}`, true)
    .field('🌐 Global Totals', `**Feeds:** ${stats.feedCount}\n**Entries Sent:** ${stats.sentCount}`, true)
    .field(
      '⚙️ System Health',
      `**Uptime:** ${uptimeStr}\n**DB Size:** ${(stats.dbSizeBytes / 1024).toFixed(1)} KB\n**Redis:** ${deps.redis ? '🟢 Connected' : '⚪ Single-instance'}`,
      true,
    )
    .field('🖥️ Web Dashboard', `[Open Dashboard](${dashboardUrl})`, true)
    .field(
      '🤖 Bot Invite',
      deps.config.redirectUrl !== null
        ? `[Invite Bot to Other Servers](${inviteUrl})`
        : 'Set `DISCORD_REDIRECT_URL` in .env',
      true,
    )
    .footer('Service Status')
    .respond();
}

registerCommandMetadata({
  name: 'stats',
  description: 'View bot statistics, service status, and dashboard info',
  category: 'utility',
  emoji: '🔧',
  usage: '/stats',
  examples: ['/stats'],
});

export const statsCommand: BotCommand = {
  def: statsCommandDef,
  category: 'utility',
  execute: handleStatsCommand,
};
