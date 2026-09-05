import { describe, it, expect, beforeEach } from 'vitest';
import { guildMemberAdd } from '../../../HELIX/src/events/guild-member-add.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';

describe('events/guild-member-add — welcome message dispatch', () => {
  let testGuildId: string;
  const testWelcomeChannelId = 'test-welcome-channel-456';
  let db: BotDatabase;

  beforeEach(() => {
    testGuildId = `test-guild-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    db = BotDatabase.getInstance();
  });

  it('does nothing if welcomeChannelId is not configured', async () => {
    let messageSent = false;
    const mockMember: any = {
      id: 'user-new',
      user: { tag: 'NewUser#0001', id: 'user-new', displayAvatarURL: () => 'https://example.com/avatar.png' },
      guild: {
        id: testGuildId,
        name: 'Test Guild',
        memberCount: 50,
        channels: {
          fetch: async () => ({
            name: 'welcome',
            isTextBased: () => true,
            isThread: () => false,
            send: async () => { messageSent = true; },
          }),
        },
      },
    };

    await guildMemberAdd.execute(mockMember);
    expect(messageSent).toBe(false);
  });

  it('dispatches welcome embed when welcomeChannelId is configured', async () => {
    db.setGuildSettings({
      guildId: testGuildId,
      welcomeChannelId: testWelcomeChannelId,
    });

    let sentPayload: any = null;
    const mockMember: any = {
      id: 'user-new',
      user: { tag: 'NewUser#0001', id: 'user-new', displayAvatarURL: () => 'https://example.com/avatar.png' },
      guild: {
        id: testGuildId,
        name: 'Test Guild',
        memberCount: 50,
        channels: {
          fetch: async (id: string) => {
            if (id === testWelcomeChannelId) {
              return {
                name: 'welcome',
                isTextBased: () => true,
                isThread: () => false,
                send: async (p: any) => { sentPayload = p; return p; },
              };
            }
            return null;
          },
        },
      },
    };

    await guildMemberAdd.execute(mockMember);

    expect(sentPayload).toBeDefined();
    expect(sentPayload.content).toContain('<@user-new>');
    expect(sentPayload.embeds).toHaveLength(1);
    const embedData = sentPayload.embeds[0].toJSON();
    expect(embedData.title).toContain('Welcome to Test Guild');
    expect(embedData.description).toContain('<@user-new>');
  });
});
