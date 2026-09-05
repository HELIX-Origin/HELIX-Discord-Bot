import { describe, it, expect, afterEach } from 'vitest';
import crypto from 'node:crypto';
import {
  resolveInternalUrl,
  getNextAuthConfig,
  createSessionToken,
  verifySessionToken,
} from '../../../HELIX/dashboard/auth/config.js';
import { EnvSandbox } from '../../helpers/env.js';

const sandbox = new EnvSandbox();

afterEach(() => {
  sandbox.restore();
});

describe('auth/config — resolveInternalUrl', () => {
  it('keeps an explicit port', () => {
    expect(resolveInternalUrl('http://localhost:4000', 5000)).toBe('http://localhost:4000');
  });

  it('attaches the bot port when omitted', () => {
    expect(resolveInternalUrl('http://localhost', 5000)).toBe('http://localhost:5000');
  });

  it('accepts scheme-less input', () => {
    expect(resolveInternalUrl('localhost:9999', 5000)).toBe('http://localhost:9999');
  });

  it('resolves explicit raw internal URL', () => {
    expect(resolveInternalUrl('http://internal.example.com/', 5000)).toBe('http://internal.example.com:5000');
  });

  it('falls back to localhost when rawInternal is omitted', () => {
    expect(resolveInternalUrl(undefined, 4040)).toBe('http://localhost:4040');
  });

  it('handles malformed input gracefully', () => {
    expect(resolveInternalUrl('://bad', 1234)).toBe('http://localhost:1234');
  });
});

describe('auth/config — getNextAuthConfig', () => {
  it('returns a complete config using the derived dashboard port (PORT + 1)', () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('NEXTAUTH_SECRET', undefined);
    sandbox.set('DISCORD_CLIENT_ID', undefined);
    sandbox.set('DISCORD_CLIENT_SECRET', undefined);
    sandbox.set('PORT', '4321');
    sandbox.set('DASHBOARD_PORT', undefined);

    const config = getNextAuthConfig();
    expect(config.url).toBe('http://localhost:4322');
    expect(config.internalUrl).toBe('http://localhost:4322');
    expect(config.secret.length).toBeGreaterThanOrEqual(32);
    expect(config.clientId).toBe('');
    expect(config.clientSecret).toBe('');
  });

  it('respects DASHBOARD_PORT override in getNextAuthConfig', () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('PORT', '4321');
    sandbox.set('DASHBOARD_PORT', '4325');

    const config = getNextAuthConfig();
    expect(config.url).toBe('http://localhost:4325');
    expect(config.internalUrl).toBe('http://localhost:4325');
  });

  it('honors a configured client id', () => {
    sandbox.set('DISCORD_CLIENT_ID', 'cli-xyz');
    const config = getNextAuthConfig();
    expect(config.clientId).toBe('cli-xyz');
  });
});

describe('auth/config — session tokens', () => {
  it('round-trips a user payload through create and verify', () => {
    const token = createSessionToken({ id: 'u1', name: 'Jane', email: 'jane@example.com' });
    const payload = verifySessionToken(token);
    expect(payload?.id).toBe('u1');
    expect(payload?.name).toBe('Jane');
    expect(payload?.email).toBe('jane@example.com');
    expect(payload?.iat).toBeGreaterThan(0);
    expect(payload?.exp).toBeGreaterThan(payload?.iat);
  });

  it('returns null for empty, malformed, or tampered tokens', () => {
    expect(verifySessionToken('')).toBeNull();
    expect(verifySessionToken('only-one-part')).toBeNull();

    const token = createSessionToken({ id: 'u1', name: 'Jane' });
    const [encoded, sig] = token.split('.');
    expect(verifySessionToken(`${encoded}AAAA.${sig}`)).toBeNull();
    expect(verifySessionToken(`Zm9vLmJhcg.${sig}`)).toBeNull();
  });

  it('rejects expired tokens', () => {
    sandbox.set('NEXTAUTH_SECRET', undefined);
    const secret = getNextAuthConfig().secret;
    const payload = { id: 'x', name: 'Old', exp: Math.floor(Date.now() / 1000) - 3600 };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
    expect(verifySessionToken(`${encodedPayload}.${signature}`)).toBeNull();
  });
});