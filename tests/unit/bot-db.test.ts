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
      ticketsHubChannelId: 'channel-999',
      ticketManagerRoleId: 'role-888',
      modLogChannelId: 'channel-777',
      welcomeChannelId: 'channel-666',
    });

    const updated = db.getGuildSettings('guild-100');
    expect(updated.prefix).toBe('$');
    expect(updated.ticketsHubChannelId).toBe('channel-999');
    expect(updated.ticketManagerRoleId).toBe('role-888');
    expect(updated.modLogChannelId).toBe('channel-777');
    expect(updated.welcomeChannelId).toBe('channel-666');
  });

  it('manages support ticket lifecycle and statistics', () => {
    const ticketId = db.createTicket({
      guildId: 'guild-200',
      channelId: 'hub-channel-1',
      threadId: 'thread-12345',
      userId: 'user-support-1',
      subject: 'Billing issue',
    });

    expect(ticketId).toBeGreaterThan(0);

    const ticket = db.getTicketByThread('thread-12345');
    expect(ticket).not.toBeNull();
    expect(ticket?.subject).toBe('Billing issue');
    expect(ticket?.status).toBe('open');

    const active = db.getUserActiveTicket('guild-200', 'user-support-1');
    expect(active).not.toBeNull();
    expect(active?.threadId).toBe('thread-12345');

    const statsBefore = db.getTicketStats('guild-200');
    expect(statsBefore.total).toBe(1);
    expect(statsBefore.open).toBe(1);
    expect(statsBefore.closed).toBe(0);

    // Close ticket
    const closed = db.closeTicket('thread-12345', 'staff-moderator-1');
    expect(closed).toBe(true);

    const statsAfter = db.getTicketStats('guild-200');
    expect(statsAfter.open).toBe(0);
    expect(statsAfter.closed).toBe(1);

    const activeAfter = db.getUserActiveTicket('guild-200', 'user-support-1');
    expect(activeAfter).toBeNull();
  });

  it('records moderation audit actions and member warnings', () => {
    db.logModeration({
      guildId: 'guild-300',
      userId: 'bad-actor-1',
      moderatorId: 'mod-1',
      action: 'kick',
      reason: 'Spamming channels',
    });

    const logs = db.getModerationLogs('guild-300');
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('kick');
    expect(logs[0].reason).toBe('Spamming channels');

    // Warnings
    const warnId = db.addWarning({
      guildId: 'guild-300',
      userId: 'bad-actor-1',
      moderatorId: 'mod-1',
      reason: 'First warning: rule violation',
    });
    expect(warnId).toBeGreaterThan(0);

    const warnings = db.getWarnings('guild-300', 'bad-actor-1');
    expect(warnings.length).toBe(1);
    expect(warnings[0].reason).toContain('First warning');

    const cleared = db.clearWarnings('guild-300', 'bad-actor-1');
    expect(cleared).toBe(1);
    expect(db.getWarnings('guild-300', 'bad-actor-1').length).toBe(0);
  });

  it('saves and retrieves personal user settings', () => {
    db.setUserSettings({
      userId: 'developer-42',
      defaultAiProvider: 'antigravity',
      notificationsEnabled: false,
    });

    const settings = db.getUserSettings('developer-42');
    expect(settings).not.toBeNull();
    expect(settings?.defaultAiProvider).toBe('antigravity');
    expect(settings?.notificationsEnabled).toBe(false);
  });
});
