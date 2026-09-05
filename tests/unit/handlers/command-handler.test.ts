import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PermissionFlagsBits } from 'discord.js';
import {
  loadPrefixCommands,
  getPrefixCommands,
  getPrefixForGuild,
  handlePrefixMessage,
} from '../../../HELIX/src/handlers/command-handler.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';
import { withTempDbEnvironment } from '../../helpers/db.js';

const tempEnv = withTempDbEnvironment();

describe('handlers/command-handler — prefix resolution & execution', () => {
  let testGuildId: string;
  let db: BotDatabase;

  afterAll(() => {
    tempEnv.cleanup();
  });

  beforeEach(async () => {
    testGuildId = `test-guild-prefix-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    db = BotDatabase.getInstance();
    db.setGuildSettings({
      guildId: testGuildId,
      prefix: '>',
    });
    await loadPrefixCommands();
  });

  it('loads prefix commands into collection', () => {
    const cmds = getPrefixCommands();
    expect(cmds.size).toBeGreaterThan(0);
    expect(cmds.has('help')).toBe(true);
    expect(cmds.has('set')).toBe(true);
    expect(cmds.has('ping')).toBe(true);
  });

  it('resolves default prefix when not configured, and custom prefix when set in DB', () => {
    const activeDb = BotDatabase.getInstance();
    const unconfiguredGuildId = `unconfigured-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    expect(getPrefixForGuild(unconfiguredGuildId)).toBe('>');
    expect(getPrefixForGuild('nonexistent-guild')).toBe('>');

    activeDb.setGuildSettings({
      guildId: unconfiguredGuildId,
      prefix: '.',
    });
    expect(getPrefixForGuild(unconfiguredGuildId)).toBe('.');
  });

  it('dispatches command using custom guild prefix', async () => {
    const activeDb = BotDatabase.getInstance();
    const customGuildId = `guild-dispatch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    activeDb.setGuildSettings({
      guildId: customGuildId,
      prefix: '.',
    });

    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { bot: false, id: 'user-777', tag: 'Tester#0001' },
      guild: { id: customGuildId, name: 'Test Guild' },
      member: {
        permissions: {
          has: () => true,
        },
      },
      channel: { name: 'general' },
      channelId: 'channel-123',
      content: '.help',
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await handlePrefixMessage(mockMessage);

    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toBeDefined();
    expect(repliedPayload.embeds.length).toBeGreaterThan(0);
  });

  it('ignores message if prefix does not match guild prefix', async () => {
    const activeDb = BotDatabase.getInstance();
    const customGuildId = `guild-ignore-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    activeDb.setGuildSettings({
      guildId: customGuildId,
      prefix: '.',
    });

    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { bot: false, id: 'user-777', tag: 'Tester#0001' },
      guild: { id: customGuildId, name: 'Test Guild' },
      member: { permissions: { has: () => true } },
      channel: { name: 'general' },
      channelId: 'channel-123',
      content: '>help', // Wrong prefix, guild is configured with '.'
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await handlePrefixMessage(mockMessage);
    expect(repliedPayload).toBeNull();
  });

  it('denies execution when user lacks required PermissionFlagsBits', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { bot: false, id: 'user-normal', tag: 'Normal#0001' },
      guild: { id: testGuildId, name: 'Test Guild' },
      member: {
        permissions: {
          has: (perm: bigint) => perm !== PermissionFlagsBits.BanMembers,
        },
      },
      channel: { name: 'general' },
      channelId: 'channel-123',
      content: '>ban @someuser',
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await handlePrefixMessage(mockMessage);
    expect(repliedPayload).toBeDefined();
    const embedData = repliedPayload.embeds[0].toJSON();
    expect(embedData.title).toContain('Error');
  });

  it('automatically delivers command dedicated help embed when required arguments are missing', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { bot: false, id: 'user-mod', tag: 'Mod#0001' },
      guild: { id: testGuildId, name: 'Test Guild' },
      member: {
        permissions: {
          has: () => true,
        },
      },
      channel: { name: 'general' },
      channelId: 'channel-123',
      content: '>ban', // Missing required 'user' option
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await handlePrefixMessage(mockMessage);
    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toBeDefined();
    expect(repliedPayload.embeds.length).toBe(1);

    const embedData = repliedPayload.embeds[0].toJSON();
    expect(embedData.title).toBe('🛡️ Command Help: `>ban`');
    expect(embedData.description).toContain('Ban a member');
    const syntaxField = embedData.fields?.find((f: any) => f.name === 'Syntax & Usage');
    expect(syntaxField).toBeDefined();
    expect(syntaxField?.value).toContain('>ban <user>');
  });

  it('delivers command help embed when subcommand missing required arguments', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { bot: false, id: 'user-admin', tag: 'Admin#0001' },
      guild: { id: testGuildId, name: 'Test Guild' },
      member: {
        permissions: {
          has: () => true,
        },
      },
      channel: { name: 'general' },
      channelId: 'channel-123',
      content: '>set slash enable', // Missing required 'category' argument
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await handlePrefixMessage(mockMessage);
    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toHaveLength(1);

    const embedData = repliedPayload.embeds[0].toJSON();
    expect(embedData.title).toContain('Command Help: `>set`');
    expect(embedData.description).toContain('Missing Required Parameter');
    expect(embedData.description).toContain('category');
    expect(embedData.fields?.some((f: any) => f.name.includes('Subcommands'))).toBe(true);
  });
});
