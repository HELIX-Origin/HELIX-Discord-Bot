import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getNextAuthConfig, createSessionToken, verifySessionToken } from '../../HELIX/dashboard/auth/config.js';
import { parseCookies } from '../../HELIX/dashboard/auth/handlers.js';

describe('NextAuth Dashboard Configuration & Session Tokens', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('reads NEXTAUTH_URL and NEXTAUTH_INTERNAL_URL from environment with proper defaults', () => {
    process.env.NEXTAUTH_URL = 'https://helix.dev/';
    process.env.NEXTAUTH_INTERNAL_URL = 'http://127.0.0.1:5000/';

    const config = getNextAuthConfig();
    expect(config.url).toBe('https://helix.dev');
    expect(config.internalUrl).toBe('http://127.0.0.1:5000');
  });

  it('automatically resolves NEXTAUTH_INTERNAL_URL=http://localhost and appends bot port without conflict', () => {
    process.env.NEXTAUTH_INTERNAL_URL = 'http://localhost';
    delete process.env.PORT;

    const config = getNextAuthConfig({ botPort: 5000 });
    expect(config.internalUrl).toBe('http://localhost:5000');

    // With a custom bot port, it should dynamically bind the custom port to avoid conflict
    const customConfig = getNextAuthConfig({ botPort: 8080 });
    expect(customConfig.internalUrl).toBe('http://localhost:8080');
  });

  it('preserves custom port if user explicitly provides one in NEXTAUTH_INTERNAL_URL', () => {
    process.env.NEXTAUTH_INTERNAL_URL = 'http://localhost:9999';

    const config = getNextAuthConfig({ botPort: 5000 });
    expect(config.internalUrl).toBe('http://localhost:9999');
  });

  it('creates and verifies cryptographically signed session tokens', () => {
    const user = { id: 'discord-user-1', name: 'HelixAdmin', email: 'admin@helix.dev' };
    const token = createSessionToken(user);

    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBe(true);

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified.id).toBe('discord-user-1');
    expect(verified.name).toBe('HelixAdmin');
  });

  it('rejects tampered or malformed session tokens', () => {
    const user = { id: 'discord-user-2', name: 'TestUser' };
    const token = createSessionToken(user);

    const tampered = token.slice(0, -4) + 'abcd';
    expect(verifySessionToken(tampered)).toBeNull();
    expect(verifySessionToken('invalid.token.structure')).toBeNull();
  });

  it('correctly parses HTTP Cookie header into key-value map', () => {
    const header = 'next-auth.session-token=secret_val_123; other=hello; theme=dark';
    const cookies = parseCookies(header);

    expect(cookies['next-auth.session-token']).toBe('secret_val_123');
    expect(cookies['other']).toBe('hello');
    expect(cookies['theme']).toBe('dark');
  });
});
