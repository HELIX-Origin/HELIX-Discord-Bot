import { describe, it, expect } from 'vitest';
import { createTestDb } from '../../helpers/db.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';

describe('database — scaffold history', () => {
  it('records and lists scaffold operations newest-first', () => {
    const h = createTestDb();
    try {
      h.db.logScaffold({ userId: 'u1', templateId: 'web-react', projectName: 'app-a' });
      h.db.logScaffold({ userId: 'u1', templateId: 'backend-go', projectName: 'svc-b' });

      const recent = h.db.getRecentScaffolds(5);
      expect(recent).toHaveLength(2);
      expect(recent[0].projectName).toBe('svc-b');
      expect(recent[0].timestamp).toBeTruthy();
      expect(h.db.getStats().scaffoldCount).toBe(2);
    } finally {
      h.cleanup();
    }
  });
});

describe('database — guild settings', () => {
  it('falls back to defaults with no stored guild', () => {
    const h = createTestDb();
    try {
      expect(h.db.getGuildSettings('missing')).toBeNull();
    } finally {
      h.cleanup();
    }
  });

  it('upserts full settings and preserves COALESCE behavior on partial write', () => {
    const h = createTestDb();
    try {
      h.db.setGuildSettings({
        guildId: 'g1',
        prefix: '!',
        callbackUrl: 'https://cb.example.com',
        ticketsHubChannelId: 'hub',
        ticketManagerRoleId: 'role',
        modLogChannelId: 'mod',
        welcomeChannelId: 'welcome',
      });

      const read = h.db.getGuildSettings('g1');
      expect(read?.prefix).toBe('!');
      expect(read?.ticketsHubChannelId).toBe('hub');

      h.db.setGuildSettings({ guildId: 'g1', prefix: '$' });
      const updated = h.db.getGuildSettings('g1');
      expect(updated?.prefix).toBe('$');
      expect(updated?.modLogChannelId).toBe('mod');
    } finally {
      h.cleanup();
    }
  });
});

describe('database — tickets', () => {
  it('creates an open ticket and rejects duplicate thread ids', () => {
    const h = createTestDb();
    try {
      const id = h.db.createTicket({
        guildId: 'g2',
        channelId: 'c1',
        threadId: 'thr-1',
        userId: 'usr-1',
        subject: 'Help',
      });
      expect(id).toBeGreaterThan(0);

      const dup = h.db.createTicket({
        guildId: 'g2',
        channelId: 'c1',
        threadId: 'thr-1',
        userId: 'usr-2',
      });
      expect(dup).toBeNull();
    } finally {
      h.cleanup();
    }
  });

  it('reports the active ticket for a user and closes tickets', () => {
    const h = createTestDb();
    try {
      h.db.createTicket({ guildId: 'g3', channelId: 'c', threadId: 'thr-a', userId: 'ua', subject: 'A' });
      h.db.createTicket({ guildId: 'g3', channelId: 'c', threadId: 'thr-c', userId: 'ub', subject: 'C' });

      const active = h.db.getUserActiveTicket('g3', 'ua');
      expect(active?.threadId).toBe('thr-a');

      expect(h.db.closeTicket('thr-a', 'staff-1')).toBe(true);
      expect(h.db.getTicketByThread('thr-a')?.status).toBe('closed');
      expect(h.db.getUserActiveTicket('g3', 'ua')).toBeNull();

      h.db.createTicket({ guildId: 'g3', channelId: 'c', threadId: 'thr-b', userId: 'ua', subject: 'B' });
      expect(h.db.getUserActiveTicket('g3', 'ua')?.threadId).toBe('thr-b');

      expect(h.db.getTicketsByGuild('g3', 'open')).toHaveLength(2);
      expect(h.db.getTicketsByGuild('g3', 'closed')).toHaveLength(1);

      const stats = h.db.getTicketStats('g3');
      expect(stats).toEqual({ total: 3, open: 2, closed: 1 });
    } finally {
      h.cleanup();
    }
  });

  it('returns the newest open ticket when a user has several open tickets (BUG-010)', () => {
    const h = createTestDb();
    try {
      h.db.createTicket({ guildId: 'g4', channelId: 'c', threadId: 'thr-1', userId: 'ux', subject: 'First' });
      h.db.createTicket({ guildId: 'g4', channelId: 'c', threadId: 'thr-2', userId: 'ux', subject: 'Second' });
      h.db.createTicket({ guildId: 'g4', channelId: 'c', threadId: 'thr-3', userId: 'ux', subject: 'Third' });

      const active = h.db.getUserActiveTicket('g4', 'ux');
      expect(active?.threadId).toBe('thr-3');
      expect(active?.subject).toBe('Third');
    } finally {
      h.cleanup();
    }
  });
});

describe('database — moderation logs and warnings', () => {
  it('logs moderation actions in order', () => {
    const h = createTestDb();
    try {
      h.db.logModeration({ guildId: 'g4', userId: 'target', moderatorId: 'mod', action: 'kick', reason: 'spam' });
      h.db.logModeration({ guildId: 'g4', userId: 'target', moderatorId: 'mod', action: 'ban', reason: 'evasion' });

      const logs = h.db.getModerationLogs('g4', 20);
      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('ban');
      expect(logs[1].reason).toBe('spam');
      expect(h.db.getStats().moderationCount).toBe(2);
    } finally {
      h.cleanup();
    }
  });

  it('adds, reads, and clears warnings', () => {
    const h = createTestDb();
    try {
      const id = h.db.addWarning({ guildId: 'g5', userId: 'u', moderatorId: 'mod', reason: 'first' });
      expect(id).toBeGreaterThan(0);
      h.db.addWarning({ guildId: 'g5', userId: 'u', moderatorId: 'mod', reason: 'second' });

      const warnings = h.db.getWarnings('g5', 'u');
      expect(warnings).toHaveLength(2);
      expect(warnings[0].reason).toBe('second');

      expect(h.db.clearWarnings('g5', 'u')).toBe(2);
      expect(h.db.getWarnings('g5', 'u')).toHaveLength(0);
    } finally {
      h.cleanup();
    }
  });
});

describe('database — user sessions and settings', () => {
  it('stores and updates sessions per provider and deletes them', () => {
    const h = createTestDb();
    try {
      h.db.setUserSession({ userId: 'u9', provider: 'discord', username: 'jane' });
      h.db.setUserSession({ userId: 'u9', provider: 'github', username: 'jane-dev' });
      h.db.setUserSession({ userId: 'u9', provider: 'github', username: 'jane-renamed' });

      const sessions = h.db.getUserSessions('u9');
      expect(sessions).toHaveLength(2);
      const gh = h.db.getUserSession('u9', 'github');
      expect(gh?.username).toBe('jane-renamed');

      expect(h.db.deleteUserSession('u9', 'github')).toBe(true);
      expect(h.db.getUserSession('u9', 'github')).toBeNull();
      expect(h.db.getAllUserSessions()).toHaveLength(1);
    } finally {
      h.cleanup();
    }
  });

  it('toggles notification settings', () => {
    const h = createTestDb();
    try {
      expect(h.db.getUserSettings('u7')).toBeNull();
      h.db.setUserSettings({ userId: 'u7', notificationsEnabled: false });
      expect(h.db.getUserSettings('u7')?.notificationsEnabled).toBe(false);
      h.db.setUserSettings({ userId: 'u7', notificationsEnabled: true });
      expect(h.db.getUserSettings('u7')?.notificationsEnabled).toBe(true);
    } finally {
      h.cleanup();
    }
  });
});

describe('database — key/value store and stats', () => {
  it('persists arbitrary KV pairs', () => {
    const h = createTestDb();
    try {
      h.db.setKv('theme', 'dark');
      h.db.setKv('theme', 'light');
      expect(h.db.getKv('theme')).toBe('light');
      expect(h.db.getKv('missing')).toBeNull();
      expect(h.db.getKv('db_version')).toBe('1.0.0');
      expect(h.db.getKv('bot_version')).toBe('0.1.0');
    } finally {
      h.cleanup();
    }
  });

  it('reports aggregate statistics', () => {
    const h = createTestDb();
    try {
      h.db.logScaffold({ userId: 'u', templateId: 'web-react', projectName: 'x' });
      h.db.setGuildSettings({ guildId: 'g9' });
      h.db.setUserSession({ userId: 'u', provider: 'discord', username: 'dev' });
      h.db.logModeration({ guildId: 'g9', userId: 't', moderatorId: 'm', action: 'warn' });

      const stats = h.db.getStats();
      expect(stats.exists).toBe(true);
      expect(stats.sizeBytes).toBeGreaterThan(0);
      expect(stats.scaffoldCount).toBe(1);
      expect(stats.guildCount).toBe(1);
      expect(stats.sessionCount).toBe(1);
      expect(stats.moderationCount).toBe(1);
      expect(stats.dbPath).toBe(h.path);
    } finally {
      h.cleanup();
    }
  });

  it('creates the database file on disk', () => {
    const h = createTestDb();
    try {
      expect(h.db.getDbPath()).toBe(h.path);
    } finally {
      h.cleanup();
    }
  });

  it('supports a singleton instance via getInstance', () => {
    const first = BotDatabase.getInstance();
    const second = BotDatabase.getInstance();
    expect(first).toBe(second);
    first.close();
  });
});

describe('database — plugin repositories', () => {
  it('adds, gets, lists, enables/disables, and removes database-backed plugin repos with guild scoping', () => {
    const h = createTestDb();
    try {
      const id1 = h.db.addPluginRepository({
        repoName: 'community/awesome-plugins',
        guildId: 'guild-100',
        configJson: JSON.stringify({ name: 'awesome', version: '1.0.0' }),
        manifestJson: JSON.stringify({ id: 'awesome-linter', version: '1.0.0' }),
        entrySource: 'exports.default = { id: "awesome-linter", lint: () => ({}) };',
        enabled: true,
      });
      expect(id1).toBeGreaterThan(0);

      const id2 = h.db.addPluginRepository({
        repoName: 'global/shared-plugins',
        guildId: null,
        configJson: JSON.stringify({ name: 'shared', version: '1.0.0' }),
        manifestJson: JSON.stringify({ id: 'shared-plugin', version: '1.0.0' }),
        entrySource: 'exports.default = { id: "shared-plugin", lint: () => ({}) };',
        enabled: true,
      });
      expect(id2).toBeGreaterThan(0);

      // Scoped lookup
      const gRepo = h.db.getPluginRepository('community/awesome-plugins', 'guild-100');
      expect(gRepo).not.toBeNull();
      expect(gRepo?.repoName).toBe('community/awesome-plugins');
      expect(gRepo?.guildId).toBe('guild-100');

      // Guild-aware list returns guild + global
      const guildList = h.db.listPluginRepositories('guild-100');
      expect(guildList).toHaveLength(2);

      // Global-only list
      const globalList = h.db.listPluginRepositories(null);
      expect(globalList).toHaveLength(1);
      expect(globalList[0].repoName).toBe('global/shared-plugins');

      // Toggle enabled
      expect(h.db.setPluginRepositoryEnabled('community/awesome-plugins', false, 'guild-100')).toBe(true);
      expect(h.db.getPluginRepository('community/awesome-plugins', 'guild-100')?.enabled).toBe(false);

      // Remove
      expect(h.db.removePluginRepository('community/awesome-plugins', 'guild-100')).toBe(true);
      expect(h.db.getPluginRepository('community/awesome-plugins', 'guild-100')).toBeNull();
      expect(h.db.listPluginRepositories('guild-100')).toHaveLength(1);
      expect(h.db.getStats().pluginRepoCount).toBe(1);
    } finally {
      h.cleanup();
    }
  });
});