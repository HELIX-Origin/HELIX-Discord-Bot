import http from 'node:http';
import { URL } from 'node:url';
import { getNextAuthConfig, createSessionToken, verifySessionToken } from './config.js';
import { BotDatabase } from '../../src/db/index.js';

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const item of cookieHeader.split(';')) {
    const [name, ...val] = item.trim().split('=');
    if (name) cookies[name] = decodeURIComponent(val.join('='));
  }
  return cookies;
}

export async function handleNextAuth(req: http.IncomingMessage, res: http.ServerResponse, pathname: string, query: URLSearchParams): Promise<boolean> {
  const config = getNextAuthConfig();

  // 1. Providers endpoint: /api/auth/providers
  if (pathname === '/api/auth/providers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      discord: {
        id: 'discord',
        name: 'Discord',
        type: 'oauth',
        signinUrl: `${config.url}/api/auth/signin/discord`,
        callbackUrl: `${config.url}/api/auth/callback/discord`,
      },
    }));
    return true;
  }

  // 2. CSRF Token endpoint: /api/auth/csrf
  if (pathname === '/api/auth/csrf') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ csrfToken: 'helix_csrf_token_active' }));
    return true;
  }

  // 3. Session endpoint: /api/auth/session
  if (pathname === '/api/auth/session') {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];
    const sessionUser = verifySessionToken(sessionToken);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (sessionUser) {
      res.end(JSON.stringify({
        user: {
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email || null,
        },
        expires: new Date(sessionUser.exp * 1000).toISOString(),
      }));
    } else {
      res.end(JSON.stringify({ user: null }));
    }
    return true;
  }

  // 4. Sign in: /api/auth/signin or /api/auth/signin/discord
  if (pathname === '/api/auth/signin' || pathname === '/api/auth/signin/discord') {
    if (!config.clientId) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>DISCORD_CLIENT_ID is not configured in .env</h1><p><a href="/dashboard">Back to Dashboard</a></p>');
      return true;
    }

    const redirectUri = encodeURIComponent(`${config.url}/api/auth/callback/discord`);
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${config.clientId}&response_type=code&scope=identify%20guilds&redirect_uri=${redirectUri}`;

    res.writeHead(302, { Location: discordAuthUrl });
    res.end();
    return true;
  }

  // 5. Sign out: /api/auth/signout
  if (pathname === '/api/auth/signout') {
    res.writeHead(302, {
      'Set-Cookie': 'next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
      Location: '/dashboard',
    });
    res.end();
    return true;
  }

  return false;
}
