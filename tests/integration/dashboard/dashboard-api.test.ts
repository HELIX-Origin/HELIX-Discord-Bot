import { describe, it, expect, afterAll } from 'vitest';
import { getNextAuthConfig } from '../../../HELIX/dashboard/auth/config.js';
import { routeDashboardRequest } from '../../../HELIX/dashboard/router.js';
import { renderDashboardHtml } from '../../../HELIX/dashboard/ui/html.js';
import { getCallbackUrl, getNextAuthUrl, detectPlatformUrl } from '../../../HELIX/src/env.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';
import { createRequest, createResponse } from '../../helpers/http.js';
import { withTempDbEnvironment } from '../../helpers/db.js';
import { EnvSandbox } from '../../helpers/env.js';

const env = withTempDbEnvironment();
const sandbox = new EnvSandbox();

describe('integration — dashboard full stack', () => {
  it('auto-resolves URLs for a one-click deploy platform without config', async () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('DISCORD_CALLBACK_URL', undefined);
    sandbox.set('RENDER_EXTERNAL_URL', 'https://helix-on-render.onrender.com');

    expect(getCallbackUrl()).toBe('https://helix-on-render.onrender.com');
    expect(getNextAuthUrl()).toBe('https://helix-on-render.onrender.com');
    expect(detectPlatformUrl()).toBe('https://helix-on-render.onrender.com');

    const config = getNextAuthConfig();
    expect(config.url).toBe('https://helix-on-render.onrender.com');
    expect(config.url + '/api/auth/callback/discord').toBe('https://helix-on-render.onrender.com/api/auth/callback/discord');
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
});

afterAll(() => {
  sandbox.restore();
  BotDatabase.getInstance().close();
  env.cleanup();
});