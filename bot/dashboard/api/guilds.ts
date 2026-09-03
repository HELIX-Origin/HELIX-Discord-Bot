import http from 'node:http';
import { BotDatabase } from '../../src/db/index.js';

export async function handleDashboardGuilds(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const db = BotDatabase.getInstance();

  if (req.method === 'GET') {
    const stats = db.getStats();
    const sessions = db.getAllUserSessions();
    const { HelixBotClient } = await import('../../src/client.js');
    const botClient = HelixBotClient.getInstance();
    const liveGuilds = botClient ? botClient.getGuildsCache() : [];

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      stats,
      sessions,
      liveGuilds,
      guildCount: liveGuilds.length,
      callbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:5000',
    }));
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const guildId = payload.guildId || 'global';
        db.setGuildSettings({
          guildId,
          prefix: payload.prefix || '/',
          aiProvider: payload.aiProvider || 'antigravity',
          callbackUrl: payload.callbackUrl || 'http://localhost:5000',
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, guildId, message: 'Settings saved' }));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Invalid payload' }));
      }
    });
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
