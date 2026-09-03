import http from 'node:http';
import { BotDatabase } from '../../src/db/index.js';
import { HelixBotClient } from '../../src/client.js';
import { AuthResolver } from '../../../src/core/auth/index.js';
import { RepoManager } from '../../../src/core/hosting/index.js';
import { resolveBotInviteUrl } from '../../src/server.js';

export function handleDashboardStats(req: http.IncomingMessage, res: http.ServerResponse): void {
  const db = BotDatabase.getInstance();
  const dbStats = db.getStats();
  const aiStatuses = AuthResolver.resolveAll();
  const repoStatuses = RepoManager.checkAll();

  // Direct bot client instance (zero-lag in-memory check)
  const botClient = HelixBotClient.getInstance();
  const isBotReady = botClient ? botClient.isReady() : false;
  const gatewayLatency = botClient ? botClient.getGatewayLatency() : -1;
  const liveGuilds = botClient ? botClient.getGuildsCache() : [];

  // Live SQLite logs
  const recentQueries = db.getRecentQueries(10);
  const recentScaffolds = db.getRecentScaffolds(10);
  const userSessions = db.getAllUserSessions();

  const callbackUrl = process.env.DISCORD_CALLBACK_URL || 'http://localhost:5000';
  const clientId = process.env.DISCORD_CLIENT_ID || null;
  const inviteUrl = resolveBotInviteUrl(process.env.NEXT_PUBLIC_INVITE_URL, callbackUrl, clientId || undefined);

  const data = {
    bot: {
      status: process.env.DISCORD_BOT_TOKEN ? (isBotReady ? 'online' : 'configured') : 'unconfigured',
      isReady: isBotReady,
      gatewayLatencyMs: gatewayLatency,
      clientId,
      guildCount: liveGuilds.length,
      callbackUrl,
      inviteUrl,
      version: '0.1.0',
      uptimeSeconds: Math.floor(process.uptime()),
      connectedGuilds: liveGuilds,
    },
    database: {
      ...dbStats,
      directConnection: true,
      latencyMs: 0, // In-process SQLite has 0 network latency
    },
    recentQueries,
    recentScaffolds,
    userSessions,
    aiProviders: aiStatuses.map(s => ({
      provider: s.provider,
      displayName: s.displayName,
      authenticated: s.authenticated,
      source: s.source,
    })),
    repoTools: repoStatuses.map(r => ({
      platform: r.platform,
      name: r.name,
      installed: r.cliInstalled,
      authenticated: r.authenticated,
      detail: r.authDetail,
    })),
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

