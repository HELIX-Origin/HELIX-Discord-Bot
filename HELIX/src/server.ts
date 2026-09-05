import http from 'node:http';
import { URL } from 'node:url';
import pc from 'picocolors';
import { logs as logger } from './handlers/logs-handler.js';
import { routeDashboardRequest } from '../dashboard/router.js';
import { getClientId, getCallbackUrl, getInviteUrl, getPort, normalizeCallbackBaseUrl } from './env.js';
import { startKeepAlive, stopKeepAlive } from './keep-alive.js';

export interface BotServerOptions {
  callbackUrl?: string;
}

export function parsePortFromUrl(urlStr: string, fallbackPort: number = 5000): number {
  try {
    const parsed = new URL(urlStr);
    return parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
  } catch {
    return fallbackPort;
  }
}

export function getBotInviteUrl(
  clientId: string,
  permissions: number = 8,
  callbackBaseUrl?: string
): string {
  let url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
  if (callbackBaseUrl) {
    const redirectUri = `${callbackBaseUrl.replace(/\/$/, '')}/api/auth/callback/discord`;
    url += `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  }
  return url;
}

export function resolveBotInviteUrl(
  rawInvite?: string,
  callbackBaseUrl?: string,
  clientId?: string
): string {
  const actualClientId = clientId || getClientId();
  const callbackBase = (callbackBaseUrl || getCallbackUrl()).replace(/\/$/, '');
  const redirectUri = `${callbackBase}/api/auth/callback/discord`;

  let invite = (rawInvite || getInviteUrl() || '').trim();

  // Strip surrounding quotes if present in env value
  if ((invite.startsWith('"') && invite.endsWith('"')) || (invite.startsWith("'") && invite.endsWith("'"))) {
    invite = invite.slice(1, -1).trim();
  }

  // If no invite URL provided, default to Discord API authorize URL with actual or placeholder client ID
  if (!invite) {
    return getBotInviteUrl(actualClientId || 'yourclientid', 8);
  }

  // Support template placeholders like {DISCORD_CALLBACK_URL} or ${DISCORD_CALLBACK_URL}
  invite = invite
    .replace(/\{DISCORD_CALLBACK_URL\}/g, callbackBase)
    .replace(/\$\{DISCORD_CALLBACK_URL\}/g, callbackBase);

  // If relative path like /invite or invite
  if (invite.startsWith('/') || invite.startsWith('invite')) {
    const cleanPath = invite.startsWith('/') ? invite : `/${invite}`;
    return `${callbackBase}${cleanPath}`;
  }

  // If actual client ID is available and placeholder exists (YOUR_CLIENT_ID or yourclientid), replace placeholder
  if (actualClientId) {
    invite = invite.replace(/YOUR_CLIENT_ID/gi, actualClientId);
    invite = invite.replace(/yourclientid/gi, actualClientId);
  }

  try {
    const parsed = new URL(invite.includes('://') ? invite : `http://${invite}`);

    // If it points to an /invite endpoint on our callback server, ensure host/protocol match callbackBase
    if (parsed.pathname === '/invite' || parsed.pathname.startsWith('/invite') || parsed.pathname === '/api/bot/invite') {
      const baseParsed = new URL(callbackBase.includes('://') ? callbackBase : `http://${callbackBase}`);
      parsed.protocol = baseParsed.protocol;
      parsed.host = baseParsed.host;
      return parsed.toString();
    }

    // If it's a direct Discord OAuth2 URL, Discord handles the entire authorization modal internally
    // without requiring redirect_uri. Only synchronize redirect_uri if one was explicitly passed in the URL.
    if (parsed.hostname.includes('discord.com')) {
      if (parsed.searchParams.has('redirect_uri')) {
        parsed.searchParams.set('redirect_uri', redirectUri);
        if (!parsed.searchParams.has('response_type')) {
          parsed.searchParams.set('response_type', 'code');
        }
      }
      if (!parsed.searchParams.has('permissions')) {
        parsed.searchParams.set('permissions', '8');
      }
      if (!parsed.searchParams.has('scope')) {
        parsed.searchParams.set('scope', 'bot');
      }
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return getBotInviteUrl(actualClientId || 'yourclientid', 8);
  }
}

export function getAuthorizationUrl(clientId: string, callbackBaseUrl: string = 'http://localhost:5000'): string {
  const redirectUri = `${callbackBaseUrl.replace(/\/$/, '')}/api/auth/callback/discord`;
  const encodedRedirect = encodeURIComponent(redirectUri);
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=8&redirect_uri=${encodedRedirect}&response_type=code`;
}

export class BotCallbackServer {
  private server: http.Server | null = null;
  private port: number;
  private baseUrl: string;

  constructor(options: BotServerOptions = {}) {
    this.baseUrl = normalizeCallbackBaseUrl(options.callbackUrl || getCallbackUrl());
    this.port = getPort();
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        // First try routing to Dashboard & NextAuth endpoints
        const dashboardHandled = await routeDashboardRequest(req, res, this.baseUrl);
        if (dashboardHandled) return;

        const reqUrl = req.url || '/';
        const parsed = new URL(reqUrl, `http://localhost:${this.port}`);

        if (parsed.pathname === '/api/auth/callback/discord') {
          const code = parsed.searchParams.get('code');
          const guildId = parsed.searchParams.get('guild_id');
          const state = parsed.searchParams.get('state'); // format: userId:guildId:provider

          if (state && code) {
            try {
              const [sUserId, sGuildId, sProvider] = decodeURIComponent(state).split(':');
              if (sUserId) {
                const { BotDatabase } = await import('./db/database.js');
                BotDatabase.getInstance().setUserSession({
                  userId: sUserId,
                  username: `Member-${sUserId.slice(-4)}`,
                  guildId: sGuildId || guildId || undefined,
                  provider: sProvider || 'discord',
                  token: code,
                });
              }
            } catch {
              // Ignore session parse error
            }
          }

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>HELIX Bot Authorization</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  background: #0f172a;
                  color: #f8fafc;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                }
                .card {
                  background: #1e293b;
                  border: 1px solid #334155;
                  border-radius: 12px;
                  padding: 32px;
                  max-width: 480px;
                  text-align: center;
                  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
                }
                h1 { color: #38bdf8; margin-top: 0; }
                p { line-height: 1.6; color: #94a3b8; }
                .code { background: #0f172a; padding: 6px 12px; border-radius: 6px; font-family: monospace; color: #4ade80; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>🧬 HELIX Session Authenticated</h1>
                <p>Discord OAuth2 authorization successful!</p>
                ${guildId ? `<p>Authorized for Guild: <span class="code">${guildId}</span></p>` : ''}
                ${code ? `<p>Session Code: <span class="code">${code.slice(0, 8)}...</span></p>` : ''}
                <p>Your member session is active in the internal SQLite database. You may now close this tab and return to Discord.</p>
              </div>
            </body>
            </html>
          `);
          return;
        }

        if (parsed.pathname === '/api/health' || parsed.pathname === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', service: 'helix-discord-bot', timestamp: new Date().toISOString() }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('HELIX Discord Bot Callback Server is running.');
      });

      this.server.on('error', (err) => {
        logger.warn(`Callback server warning: ${err.message}`);
        resolve(); // Continue even if port is already occupied
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        const callbackEndpoint = `${this.baseUrl.replace(/\/$/, '')}/api/auth/callback/discord`;
        const dashboardEndpoint = `${this.baseUrl.replace(/\/$/, '')}/dashboard`;
        logger.info(`OAuth2 Callback Server listening at: ${pc.cyan(callbackEndpoint)}`);
        logger.success(`Discord Bot Dashboard running at: ${pc.bold(pc.cyan(dashboardEndpoint))}`);
        startKeepAlive();
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    stopKeepAlive();
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
