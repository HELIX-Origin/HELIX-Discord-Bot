import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getBotInviteUrl, resolveBotInviteUrl } from '../../bot/src/server.js';

describe('Discord Bot Invite URL Generation & Dynamic Callback Resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('generates an Administrator invite URL with permissions=8 and scope=bot', () => {
    delete process.env.DISCORD_CALLBACK_URL;
    const clientId = '123456789012345678';
    const inviteUrl = getBotInviteUrl(clientId);

    expect(inviteUrl).toContain('client_id=123456789012345678');
    expect(inviteUrl).toContain('permissions=8');
    expect(inviteUrl).toContain('scope=bot');
    expect(inviteUrl.startsWith('https://discord.com/api/oauth2/authorize')).toBe(true);
    expect(inviteUrl).not.toContain('redirect_uri');
  });

  it('attaches callback base redirect_uri when callbackBaseUrl is provided', () => {
    const clientId = '123456789012345678';
    const inviteUrl = getBotInviteUrl(clientId, 8, 'http://localhost:5000');

    expect(inviteUrl).toContain('permissions=8');
    expect(inviteUrl).toContain('scope=bot');
    expect(inviteUrl).toContain('redirect_uri=' + encodeURIComponent('http://localhost:5000/api/auth/callback/discord'));
    expect(inviteUrl).toContain('response_type=code');
  });

  it('supports custom permission values when provided', () => {
    const clientId = '987654321098765432';
    const inviteUrl = getBotInviteUrl(clientId, 0);

    expect(inviteUrl).toContain('permissions=0');
  });

  it('dynamically obtains base URL from actual DISCORD_CALLBACK_URL without requiring manual edits', () => {
    process.env.DISCORD_CALLBACK_URL = 'https://my-app.herokuapp.com';
    process.env.NEXT_PUBLIC_INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot&redirect_uri=http://localhost:5000/api/auth/callback/discord&response_type=code';
    process.env.DISCORD_CLIENT_ID = '888777666555';

    const resolved = resolveBotInviteUrl();

    expect(resolved).toContain('client_id=888777666555');
    expect(resolved).toContain('permissions=8');
    expect(resolved).toContain('redirect_uri=' + encodeURIComponent('https://my-app.herokuapp.com/api/auth/callback/discord'));
    expect(resolved).not.toContain('http://localhost:5000');
  });

  it('resolves template placeholder {DISCORD_CALLBACK_URL}/invite', () => {
    process.env.DISCORD_CALLBACK_URL = 'https://custom-domain.org';
    const resolved = resolveBotInviteUrl('{DISCORD_CALLBACK_URL}/invite');

    expect(resolved).toBe('https://custom-domain.org/invite');
  });

  it('resolves relative invite path to callback base URL', () => {
    process.env.DISCORD_CALLBACK_URL = 'http://localhost:5000';
    const resolved = resolveBotInviteUrl('/invite?permissions=8');

    expect(resolved).toBe('http://localhost:5000/invite?permissions=8');
  });

  it('correctly parses NEXT_PUBLIC_INVITE_URL format with quotes and yourclientid placeholder', () => {
    process.env.NEXT_PUBLIC_INVITE_URL = '"https://discord.com/api/oauth2/authorize?client_id=yourclientid&permissions=8&scope=bot"';
    process.env.DISCORD_CLIENT_ID = '123456789012345678';

    const resolved = resolveBotInviteUrl();

    expect(resolved).toContain('client_id=123456789012345678');
    expect(resolved).toContain('permissions=8');
    expect(resolved).toContain('scope=bot');
    expect(resolved).not.toContain('"');
    expect(resolved).not.toContain('yourclientid');
  });
});
