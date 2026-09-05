import http from 'node:http';
import { BotDatabase } from '../../src/db/database.js';
import { botSettings } from '../../src/handlers/settings-manager.js';
import { getCallbackUrl } from '../../src/env.js';

export async function handleDashboardGuilds(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const db = BotDatabase.getInstance();

  if (req.method === 'GET') {
    const stats = db.getStats();
    const sessions = db.getAllUserSessions();
    const { HelixBotClient } = await import('../../src/client.js');
    const botClient = HelixBotClient.getInstance();
    const liveGuilds = botClient ? botClient.getGuildsCache() : [];

    const guildSettings: Record<string, any> = {};
    for (const g of liveGuilds) {
      guildSettings[g.id] = botSettings.getGuildSettings(g.id);
    }
    guildSettings['global'] = botSettings.getGuildSettings('global');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      stats,
      sessions,
      liveGuilds,
      guildSettings,
      guildCount: liveGuilds.length,
      callbackUrl: getCallbackUrl(),
    }));
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const guildId = payload.guildId || 'global';
        const existing = botSettings.getGuildSettings(guildId);

        const { normalizeCategories, syncGuildSlashCategories } = await import('../../src/handlers/slash-handler.js');
        const normalizedSlash = payload.enabledSlashCategories !== undefined
          ? normalizeCategories(payload.enabledSlashCategories)
          : existing?.enabledSlashCategories;

        botSettings.setGuildSettings({
          guildId,
          prefix: payload.prefix !== undefined ? payload.prefix : (existing?.prefix || '>'),
          callbackUrl: payload.callbackUrl !== undefined ? payload.callbackUrl : (existing?.callbackUrl || getCallbackUrl()),
          ticketsHubChannelId: payload.ticketsHubChannelId !== undefined ? payload.ticketsHubChannelId : existing?.ticketsHubChannelId,
          ticketManagerRoleId: payload.ticketManagerRoleId !== undefined ? payload.ticketManagerRoleId : existing?.ticketManagerRoleId,
          modLogChannelId: payload.modLogChannelId !== undefined ? payload.modLogChannelId : existing?.modLogChannelId,
          welcomeChannelId: payload.welcomeChannelId !== undefined ? payload.welcomeChannelId : existing?.welcomeChannelId,
          enabledSlashCategories: normalizedSlash,
        });

        if (payload.enabledSlashCategories !== undefined && guildId !== 'global') {
          syncGuildSlashCategories(guildId, normalizedSlash ?? undefined).catch(() => {});
        }

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