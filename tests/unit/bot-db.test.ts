import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { BotDatabase } from '../../HELIX/src/db/database.js';

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
    expect(stats.guildCount).toBe(0);
  });

  it('records project scaffolding operations in history', () => {
    db.logScaffold({
      userId: '112233',
      templateId: 'web-react',
      projectName: 'my-cool-app',
    });

    const stats = db.getStats();
    expect(stats.scaffoldCount).toBe(1);

    const scaffolds = db.getRecentScaffolds(5);
    expect(scaffolds.length).toBe(1);
    expect(scaffolds[0].projectName).toBe('my-cool-app');
    expect(scaffolds[0].templateId).toBe('web-react');
  });

  it('manages guild-specific settings with upsert behavior', () => {
    db.setGuildSettings({
      guildId: 'guild-100',
      prefix: '>',
      callbackUrl: 'http://localhost:5000',
      ticketsHubChannelId: 'channel-hub-1',
      ticketManagerRoleId: 'role-mgr-1',
      modLogChannelId: 'channel-mod-1',
      welcomeChannelId: 'channel-welcome-1',
    });

    const settings = db.getGuildSettings('guild-100');
    expect(settings).not.toBeNull();
    expect(settings?.prefix).toBe('>');
    expect(settings?.ticketsHubChannelId).toBe('channel-hub-1');
    expect(settings?.ticketManagerRoleId).toBe('role-mgr-1');
    expect(settings?.modLogChannelId).toBe('channel-mod-1');
    expect(settings?.welcomeChannelId).toBe('channel-welcome-1');

    // Update prefix
    db.setGuildSettings({
      guildId: 'guild-100',
      prefix: '$',
    });

    const updated = db.getGuildSettings('guild-100');
    expect(updated?.prefix).toBe('$');
  });

  it('creates, retrieves, and closes support tickets', () => {
    const ticketId = db.createTicket({
      guildId: 'guild-200',
      channelId: 'hub-channel-1',
      threadId: 'ticket-thread-101',
      userId: 'ticket-creator-1',
      subject: 'Billing assistance',
    });
    expect(ticketId).toBeGreaterThan(0);

    const ticket = db.getTicketByThread('ticket-thread-101');
    expect(ticket).not.toBeNull();
    expect(ticket?.status).toBe('open');
    expect(ticket?.subject).toBe('Billing assistance');

    const closed = db.closeTicket('ticket-thread-101', 'staff-member-1');
    expect(closed).toBe(true);

    const closedTicket = db.getTicketByThread('ticket-thread-101');
    expect(closedTicket?.status).toBe('closed');
    expect(closedTicket?.closedBy).toBe('staff-member-1');
  });

  it('logs moderation actions and warnings', () => {
    db.logModeration({
      guildId: 'guild-300',
      userId: 'target-user-1',
      moderatorId: 'mod-1',
      action: 'timeout',
      durationMinutes: 10,
      reason: 'Spamming',
    });

    const stats = db.getStats();
    expect(stats.moderationCount).toBe(1);

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

  it('saves and retrieves KV pairs', () => {
    db.setKv('custom_key', 'custom_value');
    expect(db.getKv('custom_key')).toBe('custom_value');
    expect(db.getKv('non_existent')).toBeNull();
  });
});
