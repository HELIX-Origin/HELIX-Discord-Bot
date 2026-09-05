import { describe, it, expect, afterEach } from 'vitest';
import { handleNextAuth, parseCookies } from '../../../HELIX/dashboard/auth/handlers.js';
import { createSessionToken } from '../../../HELIX/dashboard/auth/config.js';
import { createRequest, createResponse } from '../../helpers/http.js';
import { EnvSandbox } from '../../helpers/env.js';

const sandbox = new EnvSandbox();

afterEach(() => {
  sandbox.restore();
});

describe('auth/handlers — parseCookies', () => {
  it('returns an empty map for no cookie header', () => {
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('')).toEqual({});
  });

  it('decodes URL-encoded cookie pairs', () => {
    expect(parseCookies('a=1; b=two%20words; name=Jane')).toEqual({
      a: '1',
      b: 'two words',
      name: 'Jane',
    });
  });
});

describe('auth/handlers — endpoints', () => {
  it('serves the providers endpoint', async () => {
    const req = createRequest({ url: '/api/auth/providers' });
    const { res, result } = createResponse();
    const handled = await handleNextAuth(req, res, '/api/auth/providers', new URLSearchParams());
    expect(handled).toBe(true);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.discord.name).toBe('Discord');
    expect(body.discord.type).toBe('oauth');
    expect(body.discord.signinUrl).toContain('/api/auth/signin/discord');
  });

  it('serves the csrf endpoint', async () => {
    const req = createRequest({ url: '/api/auth/csrf' });
    const { res, result } = createResponse();
    const handled = await handleNextAuth(req, res, '/api/auth/csrf', new URLSearchParams());
    expect(handled).toBe(true);
    expect(JSON.parse(result.body).csrfToken).toBe('helix_csrf_token_active');
  });

  it('returns a null session without a cookie', async () => {
    const req = createRequest({ url: '/api/auth/session' });
    const { res, result } = createResponse();
    const handled = await handleNextAuth(req, res, '/api/auth/session', new URLSearchParams());
    expect(handled).toBe(true);
    expect(JSON.parse(result.body)).toEqual({ user: null });
  });

  it('returns the session for a valid token cookie', async () => {
    const token = createSessionToken({ id: 'u9', name: 'Zelda', email: 'z@example.com' });
    const req = createRequest({ url: '/api/auth/session', cookie: `next-auth.session-token=${token}` });
    const { res, result } = createResponse();
    const handled = await handleNextAuth(req, res, '/api/auth/session', new URLSearchParams());
    expect(handled).toBe(true);
    const body = JSON.parse(result.body);
    expect(body.user.id).toBe('u9');
    expect(body.user.name).toBe('Zelda');
    expect(body.user.email).toBe('z@example.com');
    expect(new Date(body.expires).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns a null session for a malformed cookie token', async () => {
    const req = createRequest({ url: '/api/auth/session', cookie: 'next-auth.session-token=garbage' });
    const { res, result } = createResponse();
    await handleNextAuth(req, res, '/api/auth/session', new URLSearchParams());
    expect(JSON.parse(result.body).user).toBeNull();
  });

  it('redirects to Discord OAuth2 when a client id is configured', async () => {
    sandbox.set('DISCORD_CLIENT_ID', 'abc123');
    const req = createRequest({ url: '/api/auth/signin/discord' });
    const { res, result } = createResponse();
    const handled = await handleNextAuth(req, res, '/api/auth/signin/discord', new URLSearchParams());
    expect(handled).toBe(true);
    expect(result.statusCode).toBe(302);
    expect(result.headers['Location']).toContain('https://discord.com/oauth2/authorize?client_id=abc123');
    expect(result.headers['Location']).toContain('scope=identify%20guilds');
  });

  it('shows a setup page when the client id is missing', async () => {
    sandbox.set('DISCORD_CLIENT_ID', undefined);
    const req = createRequest({ url: '/api/auth/signin' });
    const { res, result } = createResponse();
    const handled = await handleNextAuth(req, res, '/api/auth/signin', new URLSearchParams());
    expect(handled).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('DISCORD_CLIENT_ID is not configured');
  });

  it('signs out by clearing the session cookie', async () => {
    const req = createRequest({ url: '/api/auth/signout' });
    const { res, result } = createResponse();
    const handled = await handleNextAuth(req, res, '/api/auth/signout', new URLSearchParams());
    expect(handled).toBe(true);
    expect(result.statusCode).toBe(302);
    expect(result.headers['Set-Cookie']).toContain('Expires=Thu, 01 Jan 1970');
    expect(result.headers['Location']).toBe('/dashboard');
  });

  it('returns false for unknown auth endpoints', async () => {
    const req = createRequest({ url: '/api/auth/unknown' });
    const { res } = createResponse();
    const handled = await handleNextAuth(req, res, '/api/auth/unknown', new URLSearchParams());
    expect(handled).toBe(false);
  });
});