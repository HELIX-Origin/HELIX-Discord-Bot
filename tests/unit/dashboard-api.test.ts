import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { BotCallbackServer } from '../../bot/src/server.js';

describe('Discord Bot Web Dashboard & NextAuth Endpoints', () => {
  let server: BotCallbackServer;
  const testPort = 5066;
  const baseUrl = `http://localhost:${testPort}`;

  beforeAll(async () => {
    process.env.NEXTAUTH_URL = baseUrl;
    process.env.NEXTAUTH_INTERNAL_URL = `http://127.0.0.1:${testPort}`;
    server = new BotCallbackServer({ port: testPort, callbackUrl: baseUrl });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('serves the responsive Web Dashboard HTML at /dashboard', async () => {
    const htmlPromise = new Promise<string>((resolve, reject) => {
      http.get(`${baseUrl}/dashboard`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const html = await htmlPromise;
    expect(html).toContain('HELIX');
    expect(html).toContain('Dashboard');
    expect(html).toContain('NEXTAUTH_URL');
  });

  it('serves NextAuth providers configuration at /api/auth/providers', async () => {
    const jsonPromise = new Promise<string>((resolve, reject) => {
      http.get(`${baseUrl}/api/auth/providers`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const raw = await jsonPromise;
    const providers = JSON.parse(raw);
    expect(providers.discord).toBeDefined();
    expect(providers.discord.id).toBe('discord');
    expect(providers.discord.signinUrl).toBe(`${baseUrl}/api/auth/signin/discord`);
  });

  it('serves live bot and SQLite database diagnostics at /api/dashboard/stats', async () => {
    const jsonPromise = new Promise<string>((resolve, reject) => {
      http.get(`${baseUrl}/api/dashboard/stats`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const raw = await jsonPromise;
    const stats = JSON.parse(raw);
    expect(stats.bot).toBeDefined();
    expect(stats.database).toBeDefined();
    expect(stats.database.exists).toBe(true);
    expect(stats.database.directConnection).toBe(true);
    expect(stats.recentQueries).toBeInstanceOf(Array);
    expect(stats.aiProviders).toBeInstanceOf(Array);
  }, 15000);

  it('handles direct bot action /api/dashboard/bot/revoke-session gracefully', async () => {
    const postData = JSON.stringify({ userId: 'test-user-999', provider: 'discord' });
    const resPromise = new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
      const req = http.request(
        `${baseUrl}/api/dashboard/bot/revoke-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode || 200, data: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    const res = await resPromise;
    expect(res.statusCode).toBe(200);
    expect(res.data.userId).toBe('test-user-999');
  });
});
