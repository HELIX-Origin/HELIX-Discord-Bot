import { describe, it, expect, afterAll } from 'vitest';
import { routeDashboardRequest } from '../../../HELIX/dashboard/router.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';
import { createRequest, createResponse } from '../../helpers/http.js';
import { withTempDbEnvironment } from '../../helpers/db.js';
import { EnvSandbox } from '../../helpers/env.js';

const env = withTempDbEnvironment();
const sandbox = new EnvSandbox();

describe('router — UI shell', () => {
  it('serves the dashboard at /dashboard and /', async () => {
    for (const url of ['/dashboard', '/']) {
      const req = createRequest({ url });
      const { res, result } = createResponse();
      const handled = await routeDashboardRequest(req, res);
      expect(handled).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toContain('text/html');
      expect(result.body).toContain('HELIX Discord Bot Dashboard');
    }
  });
});

describe('router — bot invite', () => {
  it('redirects to the Discord authorize URL when a client id is configured', async () => {
    sandbox.set('DISCORD_CLIENT_ID', '111222333');
    sandbox.set('DISCORD_CALLBACK_URL', 'http://localhost:5000');
    try {
      const req = createRequest({ url: '/invite' });
      const { res, result } = createResponse();
      const handled = await routeDashboardRequest(req, res);
      expect(handled).toBe(true);
      expect(result.statusCode).toBe(302);
      expect(result.headers['Location']).toContain('https://discord.com/oauth2/authorize?client_id=111222333');
      expect(result.headers['Location']).toContain('scope=bot%20applications.commands');
      expect(result.headers['Location']).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fauth%2Fcallback%2Fdiscord');
    } finally {
      sandbox.restore();
    }
  });

  it('shows the client-id-needed page when unconfigured', async () => {
    sandbox.set('DISCORD_CLIENT_ID', undefined);
    try {
      const req = createRequest({ url: '/invite' });
      const { res, result } = createResponse();
      const handled = await routeDashboardRequest(req, res);
      expect(handled).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.body).toContain('Discord Client ID Needed');
    } finally {
      sandbox.restore();
    }
  });
});

describe('router — API endpoints', () => {
  it('proxies the NextAuth providers endpoint', async () => {
    const req = createRequest({ url: '/api/auth/providers' });
    const { res, result } = createResponse();
    const handled = await routeDashboardRequest(req, res);
    expect(handled).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).discord.id).toBe('discord');
  });

  it('serves live dashboard stats from the temp database', async () => {
    const req = createRequest({ url: '/api/dashboard/stats' });
    const { res, result } = createResponse();
    const handled = await routeDashboardRequest(req, res);
    expect(handled).toBe(true);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toBeDefined();
    expect(typeof body.bot).toBe('object');
    expect(body.database.directConnection).toBe(true);
  });

  it('returns false for unrecognized routes', async () => {
    const req = createRequest({ url: '/totally/unknown' });
    const { res } = createResponse();
    const handled = await routeDashboardRequest(req, res);
    expect(handled).toBe(false);
  });
});

describe('router — icon endpoint', () => {
  it('passes through /icon.jpg when no icon file exists', async () => {
    const req = createRequest({ url: '/icon.jpg' });
    const { res } = createResponse();
    const handled = await routeDashboardRequest(req, res);
    expect(handled).toBe(false);
  });

  it('claims any /api/dashboard/bot/ action path', async () => {
    const req = createRequest({ url: '/api/dashboard/bot/nope' });
    const { res } = createResponse();
    const handled = await routeDashboardRequest(req, res);
    expect(handled).toBe(true);
  });
});

afterAll(() => {
  BotDatabase.getInstance().close();
  env.cleanup();
});