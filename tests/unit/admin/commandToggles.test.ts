import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerCommand,
  getGuildEnabledCommands,
  type BotCommand,
} from '../../../src/bot/handlers/registry.js';
import { dispatchInteraction } from '../../../src/bot/handlers/commands.js';
import { handleGuildMemberAdd } from '../../../src/bot/events/member.js';
import type { AppDeps } from '../../../src/app.js';
import type { DiscordBot } from '../../../src/bot/bot.js';
import type { DiscordInteraction } from '../../../src/bot/utils/types.js';
import * as welcomeModule from '../../../src/bot/commands/admin/welcome.js';
import * as ticketModule from '../../../src/bot/commands/admin/ticket.js';
import { loadAllCommands } from '../../../src/bot/handlers/loader.js';

describe('Command Toggles & Feature Module Enforcement', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await loadAllCommands();
  });

  describe('getGuildEnabledCommands()', () => {
    it('excludes commands that are disabled for the specified guild', () => {
      const mockCmd1: BotCommand = {
        def: { name: 'toggleable1', description: 'Command 1' },
        category: 'utility',
        execute: async () => ({ type: 4 }),
      };
      const mockCmd2: BotCommand = {
        def: { name: 'toggleable2', description: 'Command 2' },
        category: 'utility',
        execute: async () => ({ type: 4 }),
      };
      registerCommand(mockCmd1);
      registerCommand(mockCmd2);

      const guildSettings: Record<string, string> = {
        'guild-100:cmd_disabled_toggleable1': '1',
      };
      const mockDeps = {
        repo: {
          getGuildSetting: (gId: string, k: string) => guildSettings[`${gId}:${k}`] ?? null,
        },
      } as unknown as AppDeps;

      const enabled = getGuildEnabledCommands('guild-100', mockDeps);
      const names = enabled.map((c) => c.name);
      expect(names).not.toContain('toggleable1');
      expect(names).toContain('toggleable2');
    });
  });

  describe('handleGuildMemberAdd()', () => {
    it('aborts sending welcome messages when welcome command is disabled for the guild', async () => {
      const sendSpy = vi.spyOn(welcomeModule, 'sendWelcomeMessage').mockResolvedValue(true);
      vi.spyOn(welcomeModule, 'getWelcomeConfig').mockReturnValue({
        enabled: true,
        channelId: 'chan-1',
        message: 'Welcome!',
        embed: true,
        color: null,
        thumbnail: true,
        banner: null,
      });

      const mockDeps = {
        repo: {
          getGuildSetting: (gId: string, k: string) => (k === 'cmd_disabled_welcome' ? '1' : null),
        },
      } as unknown as AppDeps;

      const mockBot = {
        logger: { warn: vi.fn(), debug: vi.fn() },
      } as unknown as DiscordBot;

      const mockMember = {
        guild: { id: 'guild-100', name: 'Test Guild', memberCount: 42 },
        user: { id: 'user-1', username: 'testuser', avatarURL: () => null },
        displayName: 'testuser',
      } as unknown as import('discord.js').GuildMember;

      await handleGuildMemberAdd(mockMember, mockBot, mockDeps);
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('sends welcome messages when welcome command is enabled', async () => {
      const sendSpy = vi.spyOn(welcomeModule, 'sendWelcomeMessage').mockResolvedValue(true);
      vi.spyOn(welcomeModule, 'getWelcomeConfig').mockReturnValue({
        enabled: true,
        channelId: 'chan-1',
        message: 'Welcome!',
        embed: true,
        color: null,
        thumbnail: true,
        banner: null,
      });

      const mockDeps = {
        config: {
          features: {
            administrationEnabled: true,
          },
        },
        repo: {
          getGuildSetting: () => null,
        },
      } as unknown as AppDeps;

      const mockBot = {
        logger: { warn: vi.fn(), debug: vi.fn() },
      } as unknown as DiscordBot;

      const mockMember = {
        guild: { id: 'guild-100', name: 'Test Guild', memberCount: 42 },
        user: { id: 'user-1', username: 'testuser', avatarURL: () => null },
        displayName: 'testuser',
      } as unknown as import('discord.js').GuildMember;

      await handleGuildMemberAdd(mockMember, mockBot, mockDeps);
      expect(sendSpy).toHaveBeenCalledOnce();
    });
  });

  describe('dispatchInteraction() with command disabled', () => {
    it('returns plain ephemeral content without error embed for disabled commands', async () => {
      const mockCmd: BotCommand = {
        def: { name: 'testtoggleable', description: 'Test command' },
        category: 'utility',
        execute: async () => ({ type: 4 }),
      };
      registerCommand(mockCmd);

      const mockDeps = {
        repo: {
          getGuildSetting: (gId: string, k: string) => (k === 'cmd_disabled_testtoggleable' ? '1' : null),
        },
      } as unknown as AppDeps;

      const interaction: DiscordInteraction = {
        id: 'int-1',
        application_id: 'app-1',
        token: 'tok-1',
        version: 1,
        type: 2,
        guild_id: 'guild-100',
        data: {
          name: 'testtoggleable',
        },
      };

      const res = await dispatchInteraction(interaction, mockDeps, {} as any);
      expect(res.data?.content).toBe('Command `/testtoggleable` is disabled in this server.');
      expect(res.data?.embeds).toBeUndefined();
      expect(res.data?.flags).toBe(64);
    });

    it('blocks ticket_open button interaction without error embed when ticket is disabled', async () => {
      const ticketSpy = vi.spyOn(ticketModule, 'handleTicketButton').mockResolvedValue({ type: 4 });

      const mockDeps = {
        config: {
          features: {
            administrationEnabled: true,
          },
        },
        repo: {
          getGuildSetting: (gId: string, k: string) => (k === 'cmd_disabled_ticket' ? '1' : null),
        },
      } as unknown as AppDeps;

      const interaction: DiscordInteraction = {
        id: 'btn-1',
        application_id: 'app-1',
        token: 'tok-1',
        version: 1,
        type: 3, // MESSAGE_COMPONENT
        guild_id: 'guild-100',
        data: {
          custom_id: 'ticket_open',
          component_type: 2,
        },
      };

      const res = await dispatchInteraction(interaction, mockDeps, {} as any);
      expect(ticketSpy).not.toHaveBeenCalled();
      expect(res.data?.content).toBe('The ticket system is currently disabled in this server.');
      expect(res.data?.embeds).toBeUndefined();
      expect(res.data?.flags).toBe(64);
    });
  });

  describe('FeedWatcher guild command & feature toggles', () => {
    it('skips polling when the corresponding feed command is disabled for the guild', async () => {
      const { Database } = await import('../../../src/db/database.js');
      const { Repository } = await import('../../../src/db/repository.js');
      const { FeedWatcher } = await import('../../../src/feed/watcher.js');
      const fetchModule = await import('../../../src/feed/fetch.js');

      const db = Database.open(':memory:');
      const userRow = db.raw
        .prepare("INSERT INTO users (email, password_hash, display_name, role, created_at) VALUES (?, ?, ?, 'member', ?)")
        .run('test@helix.local', 'x', 'Test', new Date().toISOString());
      const uId = Number(userRow.lastInsertRowid);
      const repo = new Repository(db);

      const feed = repo.addFeed(uId, 'Tech News', 'https://example.com/rss', 'chan-1', 'rss', null, 'guild-100');
      repo.setGuildSetting('guild-100', 'cmd_disabled_rss', '1');

      const fetchSpy = vi.spyOn(fetchModule, 'fetchRaw');
      const watcher = new FeedWatcher(repo, null, 'error');

      await watcher.pollFeed(uId, feed.id, true);
      expect(fetchSpy).not.toHaveBeenCalled();

      db.close();
    });

    it('skips polling when feature_feeds is disabled (0) for the guild', async () => {
      const { Database } = await import('../../../src/db/database.js');
      const { Repository } = await import('../../../src/db/repository.js');
      const { FeedWatcher } = await import('../../../src/feed/watcher.js');
      const fetchModule = await import('../../../src/feed/fetch.js');

      const db = Database.open(':memory:');
      const userRow = db.raw
        .prepare("INSERT INTO users (email, password_hash, display_name, role, created_at) VALUES (?, ?, ?, 'member', ?)")
        .run('test@helix.local', 'x', 'Test', new Date().toISOString());
      const uId = Number(userRow.lastInsertRowid);
      const repo = new Repository(db);

      const feed = repo.addFeed(uId, 'Tech News', 'https://example.com/rss', 'chan-1', 'rss', null, 'guild-100');
      repo.setGuildSetting('guild-100', 'feature_feeds', '0');

      const fetchSpy = vi.spyOn(fetchModule, 'fetchRaw');
      const watcher = new FeedWatcher(repo, null, 'error');

      await watcher.pollFeed(uId, feed.id, true);
      expect(fetchSpy).not.toHaveBeenCalled();

      db.close();
    });
  });
});
