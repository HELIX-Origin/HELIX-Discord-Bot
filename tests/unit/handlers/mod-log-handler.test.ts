import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sendModLog } from '../../../HELIX/src/handlers/mod-log-handler.js';
import { createTestDb, TestDbHandle } from '../../helpers/db.js';

describe('handlers/mod-log-handler — moderation audit logging', () => {
  let testGuildId: string;
  const testLogChannelId = 'test-mod-log-channel-789';
  let handle: TestDbHandle;

  beforeEach(() => {
    handle = createTestDb();
    testGuildId = `test-guild-modlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  });

  afterEach(() => {
    handle.cleanup();
  });

  it('returns false when modLogChannelId is not configured', async () => {
    const mockGuild: any = {
      id: testGuildId,
      channels: {
        fetch: async () => null,
      },
    };

    const result = await sendModLog({
      guild: mockGuild,
      action: 'ban',
      target: { id: 'target-123', tag: 'BadUser#0001' },
      moderator: { id: 'mod-456', tag: 'ModUser#0001' },
      reason: 'Rule violation',
      db: handle.db,
    });

    expect(result).toBe(false);
  });

  it('delivers formatted audit embed when modLogChannelId is configured', async () => {
    handle.db.setGuildSettings({
      guildId: testGuildId,
      modLogChannelId: testLogChannelId,
    });

    let sentPayload: any = null;
    const mockGuild: any = {
      id: testGuildId,
      channels: {
        fetch: async (id: string) => {
          if (id === testLogChannelId) {
            return {
              name: 'mod-logs',
              isTextBased: () => true,
              isThread: () => false,
              send: async (p: any) => {
                sentPayload = p;
                return p;
              },
            };
          }
          return null;
        },
      },
    };

    const result = await sendModLog({
      guild: mockGuild,
      action: 'ban',
      target: { id: 'target-123', tag: 'BadUser#0001' },
      moderator: { id: 'mod-456', tag: 'ModUser#0001' },
      reason: 'Spamming invite links',
      db: handle.db,
    });

    expect(result).toBe(true);
    expect(sentPayload).toBeDefined();
    expect(sentPayload.embeds).toHaveLength(1);
    const embedData = sentPayload.embeds[0].toJSON();
    expect(embedData.title).toContain('Moderation Log: BAN');
    expect(embedData.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Target User', value: expect.stringContaining('BadUser#0001') }),
        expect.objectContaining({ name: 'Moderator', value: expect.stringContaining('ModUser#0001') }),
        expect.objectContaining({ name: 'Reason', value: 'Spamming invite links' }),
      ])
    );
  });

  it('includes duration and count fields when supplied', async () => {
    handle.db.setGuildSettings({
      guildId: testGuildId,
      modLogChannelId: testLogChannelId,
    });

    let sentPayload: any = null;
    const mockGuild: any = {
      id: testGuildId,
      channels: {
        fetch: async () => ({
          name: 'mod-logs',
          isTextBased: () => true,
          isThread: () => false,
          send: async (p: any) => {
            sentPayload = p;
            return p;
          },
        }),
      },
    };

    const result = await sendModLog({
      guild: mockGuild,
      action: 'timeout',
      target: { id: 'target-123', tag: 'MutedUser#0001' },
      moderator: { id: 'mod-456', tag: 'ModUser#0001' },
      reason: 'Toxic behavior',
      durationMinutes: 60,
      db: handle.db,
    });

    expect(result).toBe(true);
    const embedData = sentPayload.embeds[0].toJSON();
    expect(embedData.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Duration', value: '60 minute(s)' }),
      ])
    );
  });
});
