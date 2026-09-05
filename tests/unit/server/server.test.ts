import { describe, it, expect } from 'vitest';
import { EnvSandbox } from '../../helpers/env.js';
import {
  parsePortFromUrl,
  getBotInviteUrl,
  resolveBotInviteUrl,
  getAuthorizationUrl,
  BotCallbackServer,
} from '../../../HELIX/src/server.js';

describe('server — parsePortFromUrl', () => {
  it('extracts explicit ports', () => {
    expect(parsePortFromUrl('http://localhost:5000')).toBe(5000);
    expect(parsePortFromUrl('https://app.example.com:8443')).toBe(8443);
  });

  it('defaults to scheme canonical ports when absent', () => {
    expect(parsePortFromUrl('http://localhost')).toBe(80);
    expect(parsePortFromUrl('https://app.example.com')).toBe(443);
  });

  it('falls back for unparseable input', () => {
    expect(parsePortFromUrl('not-a-url')).toBe(5000);
    expect(parsePortFromUrl('')).toBe(5000);
    expect(parsePortFromUrl('x', 4000)).toBe(4000);
  });
});

describe('server — getBotInviteUrl', () => {
  it('builds a clean Discord authorize URL', () => {
    const url = getBotInviteUrl('12345');
    expect(url).toContain('client_id=12345');
    expect(url).toContain('permissions=8');
    expect(url).toContain('scope=bot%20applications.commands');
  });

  it('appends a redirect_uri when a callback base is provided', () => {
    const url = getBotInviteUrl('12345', 8, 'https://app.example.com');
    expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fauth%2Fcallback%2Fdiscord');
    expect(url).toContain('response_type=code');
  });
});

describe('server — resolveBotInviteUrl', () => {
  it('falls back to the default authorize URL with a placeholder client id', () => {
    const sandbox = new EnvSandbox();
    sandbox.set('DISCORD_CLIENT_ID', undefined);
    sandbox.set('NEXT_PUBLIC_INVITE_URL', undefined);
    try {
      const url = resolveBotInviteUrl('', 'http://localhost:5000', undefined);
      expect(url).toContain('client_id=yourclientid');
      expect(url).toContain('permissions=8');
    } finally {
      sandbox.restore();
    }
  });

  it('synchronizes a discord.com URL host and adds required params', () => {
    const url = resolveBotInviteUrl(
      'https://discord.com/oauth2/authorize?client_id=99',
      'https://app.example.com',
      '99'
    );
    expect(url).toContain('discord.com');
    expect(url).toContain('client_id=99');
    expect(url).toContain('permissions=8');
  });

  it('replaces callback placeholders in the invite value', () => {
    const url = resolveBotInviteUrl(
      '{DISCORD_CALLBACK_URL}/invite',
      'https://app.example.com',
      '42'
    );
    expect(url).toContain('https://app.example.com/invite');
  });

  it('resolves relative /invite paths against the callback base', () => {
    const url = resolveBotInviteUrl('/invite', 'http://localhost:5000', '42');
    expect(url).toBe('http://localhost:5000/invite');
  });

  it('strips surrounding quotes from the env value', () => {
    const url = resolveBotInviteUrl(
      '"https://discord.com/oauth2/authorize?client_id=7"',
      'http://localhost:5000',
      '7'
    );
    expect(url.startsWith('"')).toBe(false);
    expect(url).toContain('client_id=7');
  });

  it('substitutes YOUR_CLIENT_ID with a real client id', () => {
    const url = resolveBotInviteUrl(
      'https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8',
      'http://localhost:5000',
      'real-id'
    );
    expect(url).toContain('client_id=real-id');
  });
});

describe('server — getAuthorizationUrl', () => {
  it('builds the OAuth2 authorize URL with encoded callback', () => {
    const url = getAuthorizationUrl('abc123', 'http://localhost:5000');
    expect(url).toContain('client_id=abc123');
    expect(url).toContain('scope=bot%20applications.commands');
    expect(url).toContain('permissions=8');
    expect(url).toContain('redirect_uri=' + encodeURIComponent('http://localhost:5000/api/auth/callback/discord'));
    expect(url).toContain('response_type=code');
  });
});

describe('server — BotCallbackServer port isolation', () => {
  it('uses explicit BOT_PORT and DASHBOARD_PORT when both are set', () => {
    const sandbox = new EnvSandbox();
    sandbox.set('BOT_PORT', '5000');
    sandbox.set('DASHBOARD_PORT', '5001');
    try {
      const server = new BotCallbackServer();
      const ports = server.getPorts();
      expect(ports.botPort).toBe(5000);
      expect(ports.dashboardPort).toBe(5001);
    } finally {
      sandbox.restore();
    }
  });

  it('respects DASHBOARD_PORT when explicitly different from BOT_PORT', () => {
    const sandbox = new EnvSandbox();
    sandbox.set('BOT_PORT', '5000');
    sandbox.set('DASHBOARD_PORT', '5555');
    try {
      const server = new BotCallbackServer();
      const ports = server.getPorts();
      expect(ports.botPort).toBe(5000);
      expect(ports.dashboardPort).toBe(5555);
    } finally {
      sandbox.restore();
    }
  });

  it('requires both BOT_PORT and DASHBOARD_PORT to be set', () => {
    const sandbox = new EnvSandbox();
    sandbox.set('BOT_PORT', '6000');
    sandbox.set('DASHBOARD_PORT', undefined);
    try {
      expect(() => new BotCallbackServer()).toThrow('DASHBOARD_PORT');
    } finally {
      sandbox.restore();
    }
  });
});