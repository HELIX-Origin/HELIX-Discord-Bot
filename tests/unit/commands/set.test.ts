import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PermissionFlagsBits } from 'discord.js';
import { set } from '../../../HELIX/src/commands/config/set.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';
import { withTempDbEnvironment } from '../../helpers/db.js';

const tempEnv = withTempDbEnvironment();

describe('commands/config/set — execute and permissions', () => {
  let db: BotDatabase;
  const testGuildId = 'test-guild-set-123';

  afterAll(() => {
    tempEnv.cleanup();
  });

  beforeEach(() => {
    db = BotDatabase.getInstance();
    // Clean up guild settings
    db.setGuildSettings({
      guildId: testGuildId,
      prefix: '>',
      ticketsHubChannelId: undefined,
      ticketManagerRoleId: undefined,
      modLogChannelId: undefined,
      welcomeChannelId: undefined,
      enabledSlashCategories: [],
    });
  });

  it('declares ManageGuild in permissions', () => {
    expect(set.permissions).toBeDefined();
    expect(set.permissions).toContain(PermissionFlagsBits.ManageGuild);
  });

  it('updates command prefix via text command args', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await set.execute({
      message: mockMessage,
      guild: { id: testGuildId } as any,
      args: ['prefix', '.'],
      getOption: () => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toHaveLength(1);
    const embedData = repliedPayload.embeds[0].toJSON();
    expect(embedData.description).toContain('Command Prefix');
    expect(embedData.description).toContain('`.`');

    const updated = db.getGuildSettings(testGuildId);
    expect(updated?.prefix).toBe('.');
  });

  it('returns missing_argument when prefix value is not provided', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await set.execute({
      message: mockMessage,
      guild: { id: testGuildId } as any,
      args: ['prefix'],
      getOption: () => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toHaveLength(1);
    const embedData = repliedPayload.embeds[0].toJSON();
    expect(embedData.description).toContain('Missing Required Parameter');
    expect(embedData.description).toContain('prefix');
  });

  it('updates tickets-hub channel with mention format', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await set.execute({
      message: mockMessage,
      guild: { id: testGuildId } as any,
      args: ['tickets-hub', '<#1122334455>'],
      getOption: () => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    const updated = db.getGuildSettings(testGuildId);
    expect(updated?.ticketsHubChannelId).toBe('1122334455');
  });

  it('updates ticket-manager-role with role mention format', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await set.execute({
      message: mockMessage,
      guild: { id: testGuildId } as any,
      args: ['ticket-manager-role', '<@&9988776655>'],
      getOption: () => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    const updated = db.getGuildSettings(testGuildId);
    expect(updated?.ticketManagerRoleId).toBe('9988776655');
  });

  it('renders guild configuration view', async () => {
    db.setGuildSettings({
      guildId: testGuildId,
      prefix: '!',
      ticketsHubChannelId: '123456',
    });

    let repliedPayload: any = null;
    const mockMessage: any = {
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await set.execute({
      message: mockMessage,
      guild: { id: testGuildId } as any,
      args: ['view'],
      getOption: () => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    const embedData = repliedPayload.embeds[0].toJSON();
    expect(embedData.title).toContain('Configuration');
  });

  it('handles slash interaction for prefix configuration', async () => {
    let repliedPayload: any = null;
    const mockInteraction: any = {
      member: {
        permissions: {
          has: (perm: bigint) => perm === PermissionFlagsBits.ManageGuild,
        },
      },
      options: {
        getSubcommand: () => 'prefix',
        getString: (name: string) => (name === 'prefix' ? '?' : null),
      },
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await set.execute({
      interaction: mockInteraction,
      guild: { id: testGuildId } as any,
      args: [],
      getOption: () => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    const updated = db.getGuildSettings(testGuildId);
    expect(updated?.prefix).toBe('?');
  });
});
