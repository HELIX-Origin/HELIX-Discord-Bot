import http from 'node:http';
import { HelixBotClient } from '../../src/client.js';
import { BotDatabase } from '../../src/db/index.js';

export async function handleDashboardBotActions(req: http.IncomingMessage, res: http.ServerResponse, action: string): Promise<void> {
  const botClient = HelixBotClient.getInstance();

  if (action === 'broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const channelId = payload.channelId?.trim();
        const message = payload.message?.trim();

        if (!channelId || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'channelId and message are required' }));
          return;
        }

        if (!botClient || !botClient.isReady()) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Discord bot is not currently connected to gateway' }));
          return;
        }

        const sent = await botClient.sendChannelMessage(channelId, message);
        if (sent) {
          // Log announcement query
          BotDatabase.getInstance().logQuery({
            userId: 'dashboard-admin',
            username: 'Dashboard Admin',
            guildId: 'broadcast',
            prompt: `[Dashboard Broadcast to ${channelId}]: ${message}`,
            provider: 'discord-gateway',
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, channelId, message: 'Message broadcast successfully' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to send message to specified channel. Check permissions and channel ID.' }));
        }
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Broadcast failed' }));
      }
    });
    return;
  }

  if (action === 'revoke-session' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userId = payload.userId?.trim();
        const provider = payload.provider?.trim();

        if (!userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userId is required' }));
          return;
        }

        const deleted = BotDatabase.getInstance().deleteUserSession(userId, provider);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: deleted, userId, provider }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Session revocation failed' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Unknown bot action: ${action}` }));
}
