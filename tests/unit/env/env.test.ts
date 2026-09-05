import { describe, it, expect, afterEach } from 'vitest';
import { EnvSandbox } from '../../helpers/env.js';
import {
  BOT_ROOT_DIR,
  getBotToken,
  getClientId,
  getClientSecret,
  getCallbackUrl,
  normalizeCallbackBaseUrl,
  getInviteUrl,
  getPort,
  getDashboardPort,
  getNextAuthUrl,
  getNextAuthInternalUrl,
  getNextAuthSecret,
  getDbPath,
  getSelfPingConfig,
  getBotEnv,
  saveBotEnvValue,
} from '../../../HELIX/src/env.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const sandbox = new EnvSandbox();

afterEach(() => {
  sandbox.restore();
});

describe('src/env.ts — bot environment accessors', () => {
  it('resolves the bot token from either supported key', () => {
    sandbox.set('DISCORD_TOKEN', 'token-a');
    expect(getBotToken()).toBe('token-a');
    sandbox.set('DISCORD_TOKEN', undefined);
    sandbox.set('DISCORD_BOT_TOKEN', 'token-b');
    expect(getBotToken()).toBe('token-b');
  });

  it('returns empty strings for unset client credentials', () => {
    sandbox.set('DISCORD_CLIENT_ID', undefined);
    sandbox.set('DISCORD_CLIENT_SECRET', undefined);
    expect(getClientId()).toBe('');
    expect(getClientSecret()).toBe('');
  });

  it('exposes the resolved bot package root two levels above src', () => {
    expect(fs.existsSync(BOT_ROOT_DIR)).toBe(true);
    expect(fs.existsSync(path.join(BOT_ROOT_DIR, 'package.json'))).toBe(true);
  });

  it('parses numeric PORT values and defaults to 5000', () => {
    sandbox.set('PORT', '8080');
    expect(getPort()).toBe(8080);
    sandbox.set('PORT', 'not-a-number');
    expect(getPort()).toBe(5000);
    sandbox.set('PORT', undefined);
    expect(getPort()).toBe(5000);
  });

  it('derives DASHBOARD_PORT as an increment of PORT and honors overrides', () => {
    sandbox.set('PORT', '5000');
    sandbox.set('DASHBOARD_PORT', undefined);
    expect(getDashboardPort()).toBe(5001);

    sandbox.set('PORT', '8080');
    expect(getDashboardPort()).toBe(8081);

    sandbox.set('DASHBOARD_PORT', '9000');
    expect(getDashboardPort()).toBe(9000);
  });

  it('resolves NextAuth URLs with static NEXTAUTH_URL and defaults to derived dashboard port', () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('PORT', '5000');
    sandbox.set('DASHBOARD_PORT', undefined);
    expect(getNextAuthUrl()).toBe('http://localhost:5001');

    sandbox.set('NEXTAUTH_URL', 'https://bot.example.com/');
    expect(getNextAuthUrl()).toBe('https://bot.example.com');

    sandbox.set('NEXTAUTH_URL', 'bot.example.com');
    expect(getNextAuthUrl()).toBe('https://bot.example.com');
  });

  it('resolves NextAuth internal URL with fallback to derived dashboard port', () => {
    sandbox.set('PORT', '5000');
    sandbox.set('DASHBOARD_PORT', undefined);
    expect(getNextAuthInternalUrl()).toBe('http://localhost:5001');

    sandbox.set('PORT', '3000');
    expect(getNextAuthInternalUrl()).toBe('http://localhost:3001');
  });

  it('falls back to the local callback URL when no platform is detected', () => {
    sandbox.set('DISCORD_CALLBACK_URL', undefined);
    sandbox.set('PORT', '5000');
    expect(getCallbackUrl()).toBe('http://localhost:5000');
  });

  it('honors an explicit non-localhost callback URL', () => {
    sandbox.set('DISCORD_CALLBACK_URL', 'https://callback.example.com/');
    expect(getCallbackUrl()).toBe('https://callback.example.com');
  });

  it('normalizes the full Discord portal callback path to its base URL', () => {
    expect(normalizeCallbackBaseUrl('https://app.example.com/api/auth/callback/discord')).toBe(
      'https://app.example.com'
    );
    expect(normalizeCallbackBaseUrl('https://app.example.com/api/auth/callback/discord/')).toBe(
      'https://app.example.com'
    );
    expect(normalizeCallbackBaseUrl('https://app.example.com/')).toBe('https://app.example.com');
    expect(normalizeCallbackBaseUrl('   ')).toBe('');
    expect(normalizeCallbackBaseUrl('https://app.example.com/api/auth/callback/discord')).toBe(
      'https://app.example.com'
    );
  });

  it('strips the suffix from a DISCORD_CALLBACK_URL pasted from the dev portal', () => {
    sandbox.set('DISCORD_CALLBACK_URL', 'https://callback.example.com/api/auth/callback/discord');
    expect(getCallbackUrl()).toBe('https://callback.example.com');
  });

  it('keeps the full-path localhost callback form usable too', () => {
    sandbox.set('DISCORD_CALLBACK_URL', 'http://localhost:5000/api/auth/callback/discord');
    sandbox.set('PORT', '5000');
    expect(getCallbackUrl()).toBe('http://localhost:5000');
  });

  it('derives NextAuth URLs from a normalized deployed callback', () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('DISCORD_CALLBACK_URL', 'https://myapp.herokuapp.com/api/auth/callback/discord');
    expect(getNextAuthUrl()).toBe('https://myapp.herokuapp.com');
  });

  it('builds a bot invite URL from a configured client id', () => {
    sandbox.set('NEXT_PUBLIC_INVITE_URL', undefined);
    sandbox.set('DISCORD_CLIENT_ID', '1234567890');
    const url = getInviteUrl();
    expect(url).toContain('client_id=1234567890');
    expect(url).toContain('scope=bot%20applications.commands');
  });

  it('strips surrounding quotes from an invite env value', () => {
    sandbox.set('NEXT_PUBLIC_INVITE_URL', '"https://discord.com/api/oauth2/authorize?client_id=1&permissions=8"');
    expect(getInviteUrl()).toBe('https://discord.com/api/oauth2/authorize?client_id=1&permissions=8');
  });

  it('resolves a secure default NextAuth secret', () => {
    sandbox.set('NEXTAUTH_SECRET', undefined);
    expect(getNextAuthSecret().length).toBeGreaterThanOrEqual(32);
  });

  it('resolves NextAuth URLs from the derived dashboard port', () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('PORT', '4000');
    expect(getNextAuthUrl()).toBe('http://localhost:4001');
    expect(getNextAuthInternalUrl()).toBe('http://localhost:4001');
  });

  it('uses derived dashboard port for localhost NextAuth URLs', () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('DISCORD_CALLBACK_URL', undefined);
    sandbox.set('PORT', '4321');
    expect(getNextAuthUrl()).toBe('http://localhost:4322');
  });

  it('keeps an external callback base when resolving the NextAuth URL', () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('DISCORD_CALLBACK_URL', 'https://myapp.herokuapp.com');
    sandbox.set('PORT', '4000');
    expect(getNextAuthUrl()).toBe('https://myapp.herokuapp.com');
  });

  it('honors explicit non-localhost NextAuth URLs', () => {
    sandbox.set('NEXTAUTH_URL', 'https://auth.example.com/');
    sandbox.set('PORT', '5000');
    expect(getNextAuthUrl()).toBe('https://auth.example.com');
  });

  it('honors DISCORD_DB_PATH for the database location', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-env-db-'));
    try {
      sandbox.set('DISCORD_DB_PATH', path.join(tmp, 'custom.sqlite'));
      expect(getDbPath()).toBe(path.join(tmp, 'custom.sqlite'));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns a complete env snapshot', () => {
    sandbox.set('DISCORD_TOKEN', 'tok');
    sandbox.set('DISCORD_CLIENT_ID', 'cid');
    sandbox.set('DISCORD_CLIENT_SECRET', 'secret');
    sandbox.set('NEXTAUTH_SECRET', undefined);
    sandbox.set('PORT', '5060');
    const env = getBotEnv();
    expect(env.botToken).toBe('tok');
    expect(env.clientId).toBe('cid');
    expect(env.clientSecret).toBe('secret');
    expect(env.port).toBe(5060);
    expect(env.dbPath).toBeTruthy();
    expect(env.nextAuthSecret.length).toBeGreaterThanOrEqual(32);
  });
});

describe('src/env.ts — saveBotEnvValue', () => {
  it('appends a new key to a missing file and updates process.env', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-env-write-'));
    try {
      const envPath = path.join(tmp, '.env');
      const written = saveBotEnvValue('CUSTOM_FLAG', 'on', envPath);
      expect(written).toBe(envPath);
      expect(fs.readFileSync(envPath, 'utf-8')).toContain('CUSTOM_FLAG=on');
      expect(process.env.CUSTOM_FLAG).toBe('on');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('replaces an existing key in place', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-env-write-'));
    try {
      const envPath = path.join(tmp, '.env');
      fs.writeFileSync(envPath, 'BOT=one\nALPHA=first\n', 'utf-8');
      saveBotEnvValue('ALPHA', 'second', envPath);
      const content = fs.readFileSync(envPath, 'utf-8');
      expect(content).toContain('ALPHA=second');
      expect(content).not.toContain('ALPHA=first');
      expect(content).toContain('BOT=one');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('src/env.ts — getSelfPingConfig', () => {
  it('returns disabled when on localhost without public NEXTAUTH_URL', () => {
    sandbox.set('NEXTAUTH_URL', undefined);
    sandbox.set('DISCORD_CALLBACK_URL', undefined);
    const config = getSelfPingConfig();
    expect(config.enabled).toBe(false);
    expect(config.intervalMs).toBe(600000);
  });

  it('auto-enables with targetUrl when a public NEXTAUTH_URL is configured', () => {
    sandbox.set('NEXTAUTH_URL', 'https://bot.example.com');
    const config = getSelfPingConfig();
    expect(config.enabled).toBe(true);
    expect(config.targetUrl).toBe('https://bot.example.com/api/health');
  });

  it('supports custom interval via HELIX_SELF_PING_INTERVAL_MS', () => {
    sandbox.set('NEXTAUTH_URL', 'https://bot.example.com');
    sandbox.set('HELIX_SELF_PING_INTERVAL_MS', '300000');
    const config = getSelfPingConfig();
    expect(config.intervalMs).toBe(300000);
  });

  it('supports explicit disable via HELIX_SELF_PING=false', () => {
    sandbox.set('NEXTAUTH_URL', 'https://bot.example.com');
    sandbox.set('HELIX_SELF_PING', 'false');
    const config = getSelfPingConfig();
    expect(config.enabled).toBe(false);
  });
});