import { describe, it, expect } from 'vitest';
import { parsePortFromUrl, getAuthorizationUrl, BotCallbackServer } from '../../bot/src/server.js';
import http from 'node:http';

describe('Discord Bot Callback Server', () => {
  it('parses ports from URLs correctly', () => {
    expect(parsePortFromUrl('http://localhost:5000')).toBe(5000);
    expect(parsePortFromUrl('http://127.0.0.1:8080')).toBe(8080);
    expect(parsePortFromUrl('https://example.com')).toBe(443);
    expect(parsePortFromUrl('invalid-url', 5000)).toBe(5000);
  });

  it('generates a valid Discord OAuth2 authorize URL with callback endpoint', () => {
    const url = getAuthorizationUrl('123456789', 'http://localhost:5000');
    expect(url).toContain('client_id=123456789');
    expect(url).toContain(encodeURIComponent('http://localhost:5000/api/auth/callback/discord'));
    expect(url).toContain('scope=bot%20applications.commands');
  });

  it('starts callback server and serves health endpoint and callback route', async () => {
    const testPort = 5055;
    const server = new BotCallbackServer({ port: testPort, callbackUrl: `http://localhost:${testPort}` });
    await server.start();

    // Test health endpoint
    const healthPromise = new Promise<string>((resolve, reject) => {
      http.get(`http://localhost:${testPort}/api/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const healthData = await healthPromise;
    const parsedHealth = JSON.parse(healthData);
    expect(parsedHealth.status).toBe('ok');
    expect(parsedHealth.service).toBe('helix-discord-bot');

    // Test callback endpoint
    const callbackPromise = new Promise<string>((resolve, reject) => {
      http.get(`http://localhost:${testPort}/api/auth/callback/discord?code=testcode123&guild_id=98765`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const callbackHtml = await callbackPromise;
    expect(callbackHtml).toContain('HELIX Session Authenticated');
    expect(callbackHtml).toContain('98765');

    await server.stop();
  });
});
