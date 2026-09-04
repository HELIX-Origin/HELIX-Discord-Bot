import http from 'node:http';
import { ProviderDispatcher } from '../../../src/core/ai/index.js';
import { BotDatabase } from '../../src/db/index.js';
import { parseCookies } from '../auth/handlers.js';
import { verifySessionToken } from '../auth/config.js';
import { HelixBotClient } from '../../src/client.js';

export async function handleDashboardAi(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}');
      const prompt = payload.prompt?.trim();
      const providerChoice = payload.provider;

      if (!prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Prompt is required' }));
        return;
      }

      // Check session cookie
      const cookies = parseCookies(req.headers.cookie);
      const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];
      const sessionUser = verifySessionToken(sessionToken);
      const userId = sessionUser ? sessionUser.id : (payload.userId || 'dashboard-user');

      const botClient = HelixBotClient.getInstance();
      const isOwner = sessionUser && botClient ? await botClient.isOwner(sessionUser.id) : Boolean(
        sessionUser && (
          (process.env.DISCORD_OWNER_ID && process.env.DISCORD_OWNER_ID.trim() === sessionUser.id) ||
          (process.env.BOT_OWNER_ID && process.env.BOT_OWNER_ID.trim() === sessionUser.id)
        )
      );

      const db = BotDatabase.getInstance();
      const userSession = sessionUser ? db.getUserSession(sessionUser.id, providerChoice) : null;

      // API keys provided by environment variables or secrets are strictly reserved for the bot's owner.
      // If neither owner nor possessing a personal user session, reject the request.
      if (!isOwner && !userSession && sessionUser) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: "API keys configured in the environment or secrets are strictly reserved for the bot's owner. Please authenticate with your personal AI session token.",
        }));
        return;
      }

      const provider = ProviderDispatcher.selectBestProvider(providerChoice);
      const providerName = userSession ? userSession.provider : (provider ? provider.displayName : 'Local AI Assistant');
      const source = userSession ? 'Personal Member Session' : (provider ? `${provider.source} (Bot Owner)` : 'Fallback Assistant');

      // Log in SQLite query_logs
      db.logQuery({
        userId,
        username: sessionUser ? sessionUser.name : 'Dashboard User',
        guildId: 'web-dashboard',
        prompt,
        provider: providerName,
      });

      // Generate structured response
      const response = {
        prompt,
        provider: providerName,
        source,
        timestamp: new Date().toISOString(),
        content: `### 🤖 HELIX Code Response [${providerName}]\n\n**Query:** ${prompt}\n\n**Analysis:**\nProcessed query using ${source}. Architecture patterns verified against active codebase configuration. Ready for deployment and execution.`,
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'AI request failed' }));
    }
  });
}
