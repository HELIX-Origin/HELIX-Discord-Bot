import http from 'node:http';
import { BotDatabase } from '../../src/db/database.js';
import { HelixBotClient } from '../../src/client.js';
import { AuthResolver } from '../../src/auth/auth-resolver.js';
import { resolveBotInviteUrl } from '../../src/server.js';
import { getCallbackUrl, getClientId, getBotToken } from '../../src/env.js';

export function handleDashboardStats(req: http.IncomingMessage, res: http.ServerResponse): void {
  const db = BotDatabase.getInstance();
  const dbStats = db.getStats();
  const aiStatuses = AuthResolver.resolveAll();

  // Direct bot client instance (zero-lag in-memory check)
  const botClient = HelixBotClient.getInstance();
  const isBotReady = botClient ? botClient.isReady() : false;
  const gatewayLatency = botClient ? botClient.getGatewayLatency() : -1;
  const liveGuilds = botClient ? botClient.getGuildsCache() : [];

  // Live SQLite logs
  const recentScaffolds = db.getRecentScaffolds(10);
  const userSessions = db.getAllUserSessions();

  const callbackUrl = getCallbackUrl();
  const clientId = getClientId() || null;
  const inviteUrl = resolveBotInviteUrl(undefined, callbackUrl, clientId || undefined);

  const data = {
    bot: {
      status: getBotToken() ? (isBotReady ? 'online' : 'configured') : 'unconfigured',
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
    recentScaffolds,
    userSessions,
    aiProviders: aiStatuses.map(s => ({
      provider: s.provider,
      displayName: s.displayName,
      authenticated: s.authenticated,
      source: s.source,
      sessionCount: s.sessionCount,
    })),
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}