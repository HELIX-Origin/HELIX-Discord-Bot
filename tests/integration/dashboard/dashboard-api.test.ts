import { describe, it, expect, afterAll } from 'vitest';
import { getNextAuthConfig } from '../../../HELIX/dashboard/auth/config.js';
import { routeDashboardRequest } from '../../../HELIX/dashboard/router.js';
import { renderDashboardHtml } from '../../../HELIX/dashboard/ui/html.js';
import { getCallbackUrl, getNextAuthUrl } from '../../../HELIX/src/env.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';
import { createRequest, createResponse } from '../../helpers/http.js';
import { withTempDbEnvironment } from '../../helpers/db.js';
import { EnvSandbox } from '../../helpers/env.js';

const env = withTempDbEnvironment();
const sandbox = new EnvSandbox();

describe('integration — dashboard full stack', () => {
  it('resolves URLs for dashboard with static NEXTAUTH_URL configuration', async () => {
    sandbox.set('NEXTAUTH_URL', 'https://bot.example.com');
    sandbox.set('DISCORD_CALLBACK_URL', undefined);
    sandbox.set('PORT', '5000');

    expect(getCallbackUrl()).toBe('http://localhost:5000');
    expect(getNextAuthUrl()).toBe('https://bot.example.com');

    const config = getNextAuthConfig();
    expect(config.url).toBe('https://bot.example.com');
    expect(config.url + '/api/auth/callback/discord').toBe('https://bot.example.com/api/auth/callback/discord');

    sandbox.set('DISCORD_CALLBACK_URL', 'https://callback.example.com');
    expect(getCallbackUrl()).toBe('https://callback.example.com');
  });

  it('tracks a user session through the bot database and into the stats route', async () => {
    const db = BotDatabase.getInstance();
    db.setUserSession({ userId: 'u77', username: 'Link', guildId: 'g9', provider: 'discord', token: 'abc' });
    db.setUserSession({ userId: 'u88', username: 'Zelda', guildId: 'g9', provider: 'discord', token: 'def' });
    expect(db.getUserSession('u77')?.username).toBe('Link');
    expect(db.getAllUserSessions().length).toBeGreaterThanOrEqual(2);

    const req = createRequest({ url: '/api/dashboard/stats' });
    const { res, result } = createResponse();
    const handled = await routeDashboardRequest(req, res);
    expect(handled).toBe(true);
    const body = JSON.parse(result.body);
    expect(body.database.directConnection).toBe(true);
    expect(body.userSessions.length).toBeGreaterThanOrEqual(2);
    expect(body.userSessions.some((s: any) => s.userId === 'u88')).toBe(true);
  });

  it('serves the live dashboard HTML against the temp database', async () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('PORT', '5000');
    const html = renderDashboardHtml();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('HELIX Discord Bot Dashboard');
  });

  it('handles scaffolding via dashboard API and provides ZIP download', async () => {
    // 1. Post scaffold request
    const postReq = createRequest({
      url: '/api/dashboard/scaffold',
      method: 'POST',
      body: JSON.stringify({
        projectName: 'dash-app',
        templateId: 'web-react',
        dryRun: false,
      }),
    });
    const { res: postRes, result: postResult } = createResponse();
    const handledPost = await routeDashboardRequest(postReq, postRes);
    expect(handledPost).toBe(true);

    const postData = JSON.parse(postResult.body);
    expect(postData.success).toBe(true);
    expect(postData.scaffoldId).toBeGreaterThan(0);
    expect(postData.downloadUrl).toContain(`/api/dashboard/scaffold/download?id=${postData.scaffoldId}`);

    // 2. Download ZIP archive
    const getReq = createRequest({
      url: postData.downloadUrl,
      method: 'GET',
    });
    const { res: getRes, result: getResult } = createResponse();
    const handledGet = await routeDashboardRequest(getReq, getRes);
    expect(handledGet).toBe(true);
    expect(getResult.statusCode).toBe(200);
    expect(getResult.headers['Content-Type']).toBe('application/zip');
    expect(getResult.headers['Content-Disposition']).toContain('attachment; filename="dash-app.zip"');
  });
});

afterAll(() => {
  sandbox.restore();
  BotDatabase.getInstance().close();
  env.cleanup();
});