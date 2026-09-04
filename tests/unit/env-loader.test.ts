import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { saveBotEnvValue } from '../../HELIX/src/env.js';

describe('Environment Loader & .env Management', () => {
  let tempDir: string;
  let tempEnvPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-env-test-'));
    tempEnvPath = path.join(tempDir, '.env');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('saves new environment variables to .env file', () => {
    saveBotEnvValue('DISCORD_TOKEN', 'test_token_123', tempEnvPath);
    saveBotEnvValue('DISCORD_CLIENT_ID', 'test_client_id_456', tempEnvPath);

    const content = fs.readFileSync(tempEnvPath, 'utf-8');
    expect(content).toContain('DISCORD_TOKEN=test_token_123');
    expect(content).toContain('DISCORD_CLIENT_ID=test_client_id_456');
    expect(process.env.DISCORD_TOKEN).toBe('test_token_123');
    expect(process.env.DISCORD_CLIENT_ID).toBe('test_client_id_456');
  });

  it('updates existing environment variables without duplicating', () => {
    saveBotEnvValue('DISCORD_CALLBACK_URL', 'http://localhost:5000', tempEnvPath);
    saveBotEnvValue('DISCORD_CALLBACK_URL', 'http://localhost:6000', tempEnvPath);

    const content = fs.readFileSync(tempEnvPath, 'utf-8');
    const matches = content.match(/DISCORD_CALLBACK_URL=/g);
    expect(matches?.length).toBe(1);
    expect(content).toContain('DISCORD_CALLBACK_URL=http://localhost:6000');
  });

  it('validates that app.json conforms to Heroku Container 1-click specification', () => {
    const appJsonPath = path.resolve(process.cwd(), 'app.json');
    expect(fs.existsSync(appJsonPath)).toBe(true);

    const raw = fs.readFileSync(appJsonPath, 'utf-8').replace(/^\uFEFF/, '');
    const appJson = JSON.parse(raw);
    expect(appJson.stack).toBe('container');
    expect(appJson.env.DISCORD_TOKEN.required).toBe(true);
    expect(appJson.env.DISCORD_CLIENT_ID.required).toBe(true);
    expect(appJson.env.DISCORD_CLIENT_SECRET.required).toBe(true);
    expect(appJson.env.NEXTAUTH_SECRET.required).toBe(true);
    expect(appJson.env.NEXTAUTH_SECRET.generator).toBe('secret');
    expect(appJson.formation.web.size).toBe('eco');
  });
});
