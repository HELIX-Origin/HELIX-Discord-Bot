import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { GuildSettingsManager, botSettings, DEFAULT_PREFIX } from '../../../HELIX/src/handlers/settings-manager.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';
import { withTempDbEnvironment } from '../../helpers/db.js';

const tempEnv = withTempDbEnvironment();

describe('handlers/settings-manager — in-memory bot session state & DB sync', () => {
  let db: BotDatabase;
  const testGuildId = `guild-session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  afterAll(() => {
    tempEnv.cleanup();
  });

  beforeEach(() => {
    botSettings.clearCache();
    db = BotDatabase.getInstance();
  });

  it('provides singleton instance and default prefix', () => {
    const instance1 = GuildSettingsManager.getInstance();
    const instance2 = GuildSettingsManager.getInstance();
    expect(instance1).toBe(instance2);
    expect(botSettings).toBe(instance1);
    expect(botSettings.getPrefix('nonexistent-guild')).toBe(DEFAULT_PREFIX);
  });

  it('updates in-memory session immediately and persists to SQLite', () => {
    botSettings.setGuildSettings({
      guildId: testGuildId,
      prefix: '!',
      ticketsHubChannelId: '111222333',
      ticketManagerRoleId: '444555666',
      modLogChannelId: '777888999',
      welcomeChannelId: '123123123',
      enabledSlashCategories: ['config', 'moderation'],
    });

    // 1. In-memory cache is immediately updated
    expect(botSettings.hasCached(testGuildId)).toBe(true);
    expect(botSettings.getPrefix(testGuildId)).toBe('!');
    expect(botSettings.getTicketsHubChannelId(testGuildId)).toBe('111222333');
    expect(botSettings.getTicketManagerRoleId(testGuildId)).toBe('444555666');
    expect(botSettings.getModLogChannelId(testGuildId)).toBe('777888999');
    expect(botSettings.getWelcomeChannelId(testGuildId)).toBe('123123123');
    expect(botSettings.getEnabledSlashCategories(testGuildId)).toEqual(['config', 'moderation']);

    // 2. Persisted to SQLite database
    const dbRecord = db.getGuildSettings(testGuildId);
    expect(dbRecord).toBeDefined();
    expect(dbRecord?.prefix).toBe('!');
    expect(dbRecord?.ticketsHubChannelId).toBe('111222333');
    expect(dbRecord?.ticketManagerRoleId).toBe('444555666');
    expect(dbRecord?.modLogChannelId).toBe('777888999');
    expect(dbRecord?.welcomeChannelId).toBe('123123123');
    expect(dbRecord?.enabledSlashCategories).toEqual(['config', 'moderation']);
  });

  it('hydrates all guild settings into session cache from database on startup', () => {
    const guildA = `guild-a-${Date.now()}`;
    const guildB = `guild-b-${Date.now()}`;

    db.setGuildSettings({ guildId: guildA, prefix: '?' });
    db.setGuildSettings({ guildId: guildB, prefix: '$' });

    botSettings.clearCache();
    expect(botSettings.isHydrated()).toBe(false);

    botSettings.hydrateFromDatabase();
    expect(botSettings.isHydrated()).toBe(true);
    expect(botSettings.hasCached(guildA)).toBe(true);
    expect(botSettings.hasCached(guildB)).toBe(true);
    expect(botSettings.getPrefix(guildA)).toBe('?');
    expect(botSettings.getPrefix(guildB)).toBe('$');
  });

  it('lazily caches unhydrated guild when requested', () => {
    const lazyGuild = `guild-lazy-${Date.now()}`;
    db.setGuildSettings({ guildId: lazyGuild, prefix: '~' });

    botSettings.clearCache();
    expect(botSettings.hasCached(lazyGuild)).toBe(false);

    const fetched = botSettings.getGuildSettings(lazyGuild);
    expect(fetched.prefix).toBe('~');
    expect(botSettings.hasCached(lazyGuild)).toBe(true);
  });

  it('guarantees complete guild settings persistence across simulated bot relaunches', () => {
    const relaunchGuildId = `guild-relaunch-${Date.now()}`;

    // 1. Initial bot session: User configures server settings
    botSettings.setGuildSettings({
      guildId: relaunchGuildId,
      prefix: '?',
      ticketsHubChannelId: '999888777',
      ticketManagerRoleId: '111222333',
      modLogChannelId: '444555666',
      welcomeChannelId: '777888999',
      enabledSlashCategories: ['utility', 'moderation', 'config'],
    });

    // 2. Verify in-memory state before shutdown
    expect(botSettings.getPrefix(relaunchGuildId)).toBe('?');
    expect(botSettings.getTicketsHubChannelId(relaunchGuildId)).toBe('999888777');
    expect(botSettings.getTicketManagerRoleId(relaunchGuildId)).toBe('111222333');
    expect(botSettings.getModLogChannelId(relaunchGuildId)).toBe('444555666');
    expect(botSettings.getWelcomeChannelId(relaunchGuildId)).toBe('777888999');
    expect(botSettings.getEnabledSlashCategories(relaunchGuildId)).toEqual(['utility', 'moderation', 'config']);

    // 3. Simulate full bot shutdown & relaunch (purge in-memory session cache)
    botSettings.clearCache();
    expect(botSettings.hasCached(relaunchGuildId)).toBe(false);

    // 4. Simulate bot startup hydration
    botSettings.hydrateFromDatabase();
    expect(botSettings.hasCached(relaunchGuildId)).toBe(true);

    // 5. Assert all settings restored exactly as configured from SQLite persistence
    expect(botSettings.getPrefix(relaunchGuildId)).toBe('?');
    expect(botSettings.getTicketsHubChannelId(relaunchGuildId)).toBe('999888777');
    expect(botSettings.getTicketManagerRoleId(relaunchGuildId)).toBe('111222333');
    expect(botSettings.getModLogChannelId(relaunchGuildId)).toBe('444555666');
    expect(botSettings.getWelcomeChannelId(relaunchGuildId)).toBe('777888999');
    expect(botSettings.getEnabledSlashCategories(relaunchGuildId)).toEqual(['utility', 'moderation', 'config']);
  });
});
