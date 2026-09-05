import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionFlagsBits } from 'discord.js';
import {
  loadPrefixCommands,
  getPrefixCommands,
  getPrefixForGuild,
  handlePrefixMessage,
} from '../../../HELIX/src/handlers/command-handler.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';

describe('handlers/command-handler — prefix resolution & execution', () => {
  const testGuildId = 'test-guild-prefix-999';
  let db: BotDatabase;

  beforeEach(async () => {
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
    expect(getPrefixForGuild(testGuildId)).toBe('>');
    expect(getPrefixForGuild('nonexistent-guild')).toBe('>');

    db.setGuildSettings({
      guildId: testGuildId,
      prefix: '.',
    });
    expect(getPrefixForGuild(testGuildId)).toBe('.');
  });

  it('dispatches command using custom guild prefix', async () => {
    db.setGuildSettings({
      guildId: testGuildId,
      prefix: '.',
    });

    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { bot: false, id: 'user-777', tag: 'Tester#0001' },
      guild: { id: testGuildId, name: 'Test Guild' },
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
    db.setGuildSettings({
      guildId: testGuildId,
      prefix: '.',
    });

    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { bot: false, id: 'user-777', tag: 'Tester#0001' },
      guild: { id: testGuildId, name: 'Test Guild' },
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
});
