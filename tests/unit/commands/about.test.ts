/**
 * tests/unit/commands/about.test.ts
 *
 * Unit tests for the consolidated `/about` command:
 *   - `/about bot`
 *   - `/about guild`
 *   - `/about user [@user]`
 */
import { describe, it, expect } from 'vitest';
import { handleAboutCommand, aboutCommandDef } from '../../../src/bot/commands/utility/about.js';
import type { AppDeps } from '../../../src/app.js';
import type { DiscordInteraction } from '../../../src/bot/utils/types.js';

function makeDeps(): AppDeps {
  return {
    config: {
      publicBaseUrl: 'https://helix.example.com',
      redirectUrl: 'https://discord.com/oauth2/authorize?client_id=123',
      repoUrl: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot',
    },
    bot: {
      getAppName: () => 'HELIX Bot',
      getAppIconUrl: () => 'https://cdn.example.com/icon.png',
      getGuildsWithChannels: async () => [
        { id: 'guild-123', name: 'Test Guild', icon: 'iconhash', channels: [{ id: 'ch-1' }, { id: 'ch-2' }] },
      ],
      getGuildMemberCount: async () => 42,
      getGuildRoles: async () => [{ id: 'role-1', name: 'Member' }],
      getGuildMember: async () => ({
        username: 'alice',
        nickname: 'AliceInWonderland',
        globalName: 'Alice Global',
        avatar: 'avatarhash',
        bot: false,
        joinedAt: '2024-01-01T00:00:00.000Z',
        roles: [{ id: 'role-1', name: 'Member' }],
      }),
    },
  } as unknown as AppDeps;
}

function makeInteraction(overrides: Partial<DiscordInteraction> = {}): DiscordInteraction {
  return {
    id: 'int-123',
    application_id: 'app-123',
    type: 2,
    token: 'tok-123',
    version: 1,
    ...overrides,
    data: {
      id: 'cmd-123',
      type: 1,
      name: 'about',
      ...overrides.data,
    },
  };
}

describe('aboutCommandDef', () => {
  it('defines the three required subcommands: bot, user, guild', () => {
    const subNames = aboutCommandDef.options?.map((o) => o.name);
    expect(subNames).toContain('bot');
    expect(subNames).toContain('user');
    expect(subNames).toContain('guild');
  });

  it('user subcommand has an optional user option', () => {
    const userSub = aboutCommandDef.options?.find((o) => o.name === 'user');
    expect(userSub?.options).toBeDefined();
    const opt = userSub?.options?.[0];
    expect(opt?.name).toBe('user');
    expect(opt?.required).toBe(false);
  });
});

describe('handleAboutCommand — /about bot', () => {
  it('returns rich bot description and fields', async () => {
    const deps = makeDeps();
    const interaction = makeInteraction({
      data: {
        id: 'cmd-123',
        type: 1,
        name: 'about',
        options: [{ name: 'bot', type: 1 }],
      },
    });

    const res = await handleAboutCommand(interaction, deps);
    expect(res.data?.embeds).toBeDefined();
    const embed = res.data!.embeds![0];
    expect(embed.title).toContain('About');
    expect(embed.description).toContain('HELIX Bot');
    expect(embed.fields).toBeDefined();
    expect(embed.fields!.length).toBeGreaterThan(5);
  });
});

describe('handleAboutCommand — /about guild', () => {
  it('returns server error when called in DM (no guild_id)', async () => {
    const deps = makeDeps();
    const interaction = makeInteraction({
      guild_id: undefined,
      data: {
        id: 'cmd-123',
        type: 1,
        name: 'about',
        options: [{ name: 'guild', type: 1 }],
      },
    });

    const res = await handleAboutCommand(interaction, deps);
    const embed = res.data!.embeds![0];
    expect(embed.title).toContain('Server Only');
  });

  it('returns server details when called inside a guild', async () => {
    const deps = makeDeps();
    const interaction = makeInteraction({
      guild_id: 'guild-123',
      data: {
        id: 'cmd-123',
        type: 1,
        name: 'about',
        options: [{ name: 'guild', type: 1 }],
      },
    });

    const res = await handleAboutCommand(interaction, deps);
    const embed = res.data!.embeds![0];
    expect(embed.title).toContain('Test Guild');
    expect(embed.fields?.some((f) => f.name.includes('Server ID') && f.value.includes('guild-123'))).toBe(true);
    expect(embed.fields?.some((f) => f.name.includes('Members') && f.value.includes('42'))).toBe(true);
  });
});

describe('handleAboutCommand — /about user', () => {
  it('returns caller info by default when no target member is specified', async () => {
    const deps = makeDeps();
    const interaction = makeInteraction({
      guild_id: 'guild-123',
      user: {
        id: 'user-456',
        username: 'bob',
      },
      data: {
        id: 'cmd-123',
        type: 1,
        name: 'about',
        options: [{ name: 'user', type: 1, options: [] }],
      },
    });

    const res = await handleAboutCommand(interaction, deps);
    const embed = res.data!.embeds![0];
    expect(embed.description).toContain('<@user-456>');
    expect(embed.fields?.some((f) => f.name.includes('User ID') && f.value.includes('user-456'))).toBe(true);
  });

  it('looks up specified user when user option is provided', async () => {
    const deps = makeDeps();
    const interaction = makeInteraction({
      guild_id: 'guild-123',
      user: {
        id: 'caller-999',
        username: 'caller',
      },
      data: {
        id: 'cmd-123',
        type: 1,
        name: 'about',
        options: [
          {
            name: 'user',
            type: 1,
            options: [{ name: 'user', type: 6, value: 'target-789' }],
          },
        ],
      },
    });

    const res = await handleAboutCommand(interaction, deps);
    const embed = res.data!.embeds![0];
    expect(embed.description).toContain('<@target-789>');
    expect(embed.fields?.some((f) => f.name.includes('User ID') && f.value.includes('target-789'))).toBe(true);
  });
});
