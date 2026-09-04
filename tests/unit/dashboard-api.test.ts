import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { BotCallbackServer } from '../../HELIX/src/server.js';

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
    expect(stats.recentScaffolds).toBeInstanceOf(Array);
    expect(stats.plugins).toBeDefined();
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

  it('serves and saves guild configurations at /api/dashboard/guilds', async () => {
    // 1. GET guilds
    const getRes = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
      http.get(`${baseUrl}/api/dashboard/guilds`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode || 200, data: JSON.parse(body) }));
      }).on('error', reject);
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.data.guildSettings).toBeDefined();

    // 2. POST guild settings
    const postData = JSON.stringify({
      guildId: 'guild-test-123',
      prefix: '!',
      ticketsHubChannelId: '987654321',
      modLogChannelId: '123456789',
    });

    const postRes = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
      const req = http.request(
        `${baseUrl}/api/dashboard/guilds`,
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

    expect(postRes.statusCode).toBe(200);
    expect(postRes.data.success).toBe(true);
    expect(postRes.data.guildId).toBe('guild-test-123');
  });

  it('executes dry-run scaffolding and returns files list at /api/dashboard/scaffold', async () => {
    const postData = JSON.stringify({
      projectName: 'dashboard-test-app',
      templateId: 'web-react',
      dryRun: true,
    });

    const postRes = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
      const req = http.request(
        `${baseUrl}/api/dashboard/scaffold`,
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

    expect(postRes.statusCode).toBe(200);
    expect(postRes.data.success).toBe(true);
    expect(postRes.data.files).toBeInstanceOf(Array);
    expect(postRes.data.files.length).toBeGreaterThan(0);
  });
});
