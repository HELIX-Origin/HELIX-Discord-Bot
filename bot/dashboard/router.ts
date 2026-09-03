import http from 'node:http';
import { URL } from 'node:url';
import { handleNextAuth } from './auth/handlers.js';
import { handleDashboardStats } from './api/stats.js';
import { handleDashboardAi } from './api/ai.js';
import { handleDashboardScaffold } from './api/scaffold.js';
import { handleDashboardGuilds } from './api/guilds.js';
import { renderDashboardHtml } from './ui/html.js';

export async function routeDashboardRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  baseUrl: string = 'http://localhost:5000',
  botPort?: number
): Promise<boolean> {
  const reqUrl = req.url || '/';
  const parsed = new URL(reqUrl, baseUrl);
  const pathname = parsed.pathname;

  // 1. Dashboard UI Shell
  if (pathname === '/dashboard' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderDashboardHtml(botPort));
    return true;
  }

  // 2. Bot Invite Redirect Endpoint ({DISCORD_CALLBACK_URL}/invite)
  if (pathname === '/invite' || pathname === '/api/bot/invite') {
    const clientId = process.env.DISCORD_CLIENT_ID || parsed.searchParams.get('client_id');
    const permissions = parsed.searchParams.get('permissions') || '8';
    const scope = parsed.searchParams.get('scope') || 'bot applications.commands';
    const callbackUrl = process.env.DISCORD_CALLBACK_URL || baseUrl;
    const redirectUri = `${callbackUrl.replace(/\/$/, '')}/api/auth/callback/discord`;

    if (!clientId) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Discord Bot Setup Needed</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0f19] text-white flex items-center justify-center min-h-screen font-sans p-6">
  <div class="max-w-md w-full bg-gray-900/90 border border-gray-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl backdrop-blur-xl">
    <div class="text-4xl">🤖</div>
    <h2 class="text-xl font-bold text-cyan-400">Discord Client ID Needed</h2>
    <p class="text-sm text-gray-400">Please configure <code class="text-cyan-300 bg-gray-800 px-2 py-0.5 rounded font-mono">DISCORD_CLIENT_ID</code> in your <code class="text-cyan-300 bg-gray-800 px-2 py-0.5 rounded font-mono">.env</code> file before inviting the bot.</p>
    <a href="/dashboard" class="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/30">Back to Dashboard</a>
  </div>
</body>
</html>`);
      return true;
    }

    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    res.writeHead(302, { Location: discordAuthUrl });
    res.end();
    return true;
  }

  // 3. NextAuth API Endpoints
  if (pathname.startsWith('/api/auth/')) {
    const handled = await handleNextAuth(req, res, pathname, parsed.searchParams);
    if (handled) return true;
  }

  // 3. Direct Bot Interaction API Endpoints
  if (pathname === '/api/dashboard/stats') {
    handleDashboardStats(req, res);
    return true;
  }

  if (pathname === '/api/dashboard/ai' && req.method === 'POST') {
    await handleDashboardAi(req, res);
    return true;
  }

  if (pathname === '/api/dashboard/scaffold' && req.method === 'POST') {
    await handleDashboardScaffold(req, res);
    return true;
  }

  if (pathname === '/api/dashboard/guilds') {
    await handleDashboardGuilds(req, res);
    return true;
  }

  // 4. Direct Zero-Lag Bot Actions (Broadcast, Revoke Session)
  if (pathname.startsWith('/api/dashboard/bot/')) {
    const action = pathname.replace('/api/dashboard/bot/', '');
    const { handleDashboardBotActions } = await import('./api/bot-actions.js');
    await handleDashboardBotActions(req, res, action);
    return true;
  }

  return false;
}
