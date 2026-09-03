import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { BotDatabase } from '../../bot/src/db/index.js';

describe('Discord Bot Internal SQLite Database', () => {
  let tempDir: string;
  let tempDbPath: string;
  let db: BotDatabase;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-db-test-'));
    tempDbPath = path.join(tempDir, 'test-bot.sqlite');
    db = new BotDatabase(tempDbPath);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('initializes the SQLite database file and schema', () => {
    expect(fs.existsSync(tempDbPath)).toBe(true);
    const stats = db.getStats();
    expect(stats.exists).toBe(true);
    expect(stats.sizeBytes).toBeGreaterThan(0);
    expect(stats.queryCount).toBe(0);
  });

  it('logs and counts queries properly', () => {
    db.logQuery({
      userId: '112233',
      username: 'HelixDev',
      guildId: '998877',
      prompt: 'How do I add a slash command?',
      provider: 'Google Antigravity',
    });

    const stats = db.getStats();
    expect(stats.queryCount).toBe(1);
  });

  it('records project scaffolding operations in history', () => {
    db.logScaffold({
      userId: '112233',
      templateId: 'web-react',
      projectName: 'my-cool-app',
    });

    const stats = db.getStats();
    expect(stats.scaffoldCount).toBe(1);
  });

  it('manages guild-specific settings with upsert behavior', () => {
    db.setGuildSettings({
      guildId: 'guild-100',
      prefix: '!',
      aiProvider: 'copilot',
      callbackUrl: 'http://localhost:5000',
    });

    const settings = db.getGuildSettings('guild-100');
    expect(settings).not.toBeNull();
    expect(settings.prefix).toBe('!');
    expect(settings.ai_provider).toBe('copilot');

    // Update settings
    db.setGuildSettings({
      guildId: 'guild-100',
      prefix: '$',
    });

    const updated = db.getGuildSettings('guild-100');
    expect(updated.prefix).toBe('$');
  });
});
