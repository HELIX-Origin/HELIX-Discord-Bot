import { describe, it, expect } from 'vitest';
import { handleWelcomeCommand, getWelcomeConfig } from '../../../src/bot/commands/admin/welcome.js';
import { welcomeOptions, WELCOME_ACTIONS } from '../../../src/bot/lib/options/welcome.js';
import type { AppDeps } from '../../../src/app.js';
import { ApplicationCommandOptionType, type DiscordInteraction } from '../../../src/bot/utils/types.js';

function makeDeps(initialSettings: Record<string, string> = {}): { deps: AppDeps; settings: Record<string, string>; sentMessages: { channelId: string; payload: unknown }[] } {
  const settings: Record<string, string> = { ...initialSettings };
  const sentMessages: { channelId: string; payload: unknown }[] = [];

  const deps = {
    config: {
      features: { administrationEnabled: true },
    },
    repo: {
      getGuildSetting(guildId: string, key: string) {
        return settings[`${guildId}:${key}`] ?? null;
      },
      setGuildSetting(guildId: string, key: string, val: string) {
        settings[`${guildId}:${key}`] = val;
      },
      logActivity: () => {},
      getGuildBinding: () => ({ name: 'Test Guild' }),
      getOrCreateGuildUser: () => ({ id: 1 }),
    },
    bot: {
      getAppName: () => 'HELIX Bot',
      sendChannelMessage: async (channelId: string, payload: unknown) => {
        sentMessages.push({ channelId, payload });
      },
      getGuildMemberCount: async () => 99,
    },
  } as unknown as AppDeps;

  return { deps, settings, sentMessages };
}

function makeInteraction(options: { name: string; value?: string | number | boolean }[] = []): DiscordInteraction {
  return {
    id: 'int-1',
    application_id: 'app-1',
    type: 2,
    token: 'tok-1',
    version: 1,
    guild_id: 'guild-123',
    member: {
      user: { id: 'user-1', username: 'tester', global_name: 'Tester' },
      permissions: '8',
    },
    data: {
      id: 'cmd-1',
      type: 1,
      name: 'welcome',
      options: options.map((o) => ({
        type: ApplicationCommandOptionType.STRING,
        ...o,
      })),
    },
  };
}

describe('welcomeOptions', () => {
  it('exports valid options and actions from options file', () => {
    expect(welcomeOptions).toBeDefined();
    expect(WELCOME_ACTIONS).toContain('setup');
    expect(WELCOME_ACTIONS).toContain('channel');
    expect(WELCOME_ACTIONS).toContain('message');
    expect(WELCOME_ACTIONS).toContain('view');
    expect(WELCOME_ACTIONS).toContain('test');
    expect(WELCOME_ACTIONS).toContain('disable');
  });

  it('contains clear parameter definitions without subcommands', () => {
    const actionOpt = welcomeOptions.find((o) => o.name === 'action');
    expect(actionOpt).toBeDefined();
    expect(actionOpt?.required).toBe(true);

    const channelOpt = welcomeOptions.find((o) => o.name === 'channel');
    expect(channelOpt).toBeDefined();

    const contentOpt = welcomeOptions.find((o) => o.name === 'content');
    expect(contentOpt).toBeDefined();
  });
});

describe('handleWelcomeCommand — Setup & Actions', () => {
  it('configures channel, message, and embed styling in setup action', async () => {
    const { deps, settings } = makeDeps();
    const interaction = makeInteraction([
      { name: 'action', value: 'setup' },
      { name: 'channel', value: '111222333' },
      { name: 'content', value: 'Welcome {mention} to {server}!' },
      { name: 'embed', value: true },
      { name: 'color', value: '#06b6d4' },
      { name: 'thumbnail', value: true },
    ]);

    const res = await handleWelcomeCommand(interaction, deps, {} as never);
    expect(res.data?.embeds?.[0].title).toContain('Welcome System Configured');
    expect(settings['guild-123:welcome_channel_id']).toBe('111222333');
    expect(settings['guild-123:welcome_message']).toBe('Welcome {mention} to {server}!');
    expect(settings['guild-123:welcome_embed']).toBe('1');
    expect(settings['guild-123:welcome_color']).toBe('#06b6d4');
    expect(settings['guild-123:welcome_thumbnail']).toBe('1');

    const config = getWelcomeConfig(deps, 'guild-123');
    expect(config.enabled).toBe(true);
    expect(config.channelId).toBe('111222333');
  });

  it('configures welcome channel with channel action', async () => {
    const { deps, settings } = makeDeps();
    const interaction = makeInteraction([
      { name: 'action', value: 'channel' },
      { name: 'channel', value: '999888777' },
    ]);

    const res = await handleWelcomeCommand(interaction, deps, {} as never);
    expect(res.data?.embeds?.[0].title).toContain('Welcome Channel Set');
    expect(settings['guild-123:welcome_channel_id']).toBe('999888777');
  });

  it('updates styling without requiring content in message action', async () => {
    const { deps, settings } = makeDeps();
    const interaction = makeInteraction([
      { name: 'action', value: 'message' },
      { name: 'color', value: '#10b981' },
      { name: 'embed', value: true },
    ]);

    const res = await handleWelcomeCommand(interaction, deps, {} as never);
    expect(res.data?.embeds?.[0].title).toContain('Welcome Message Updated');
    expect(settings['guild-123:welcome_color']).toBe('#10b981');
    expect(settings['guild-123:welcome_embed']).toBe('1');
  });

  it('disables the welcome system and clears channel', async () => {
    const { deps, settings } = makeDeps({ 'guild-123:welcome_channel_id': '123' });
    const interaction = makeInteraction([{ name: 'action', value: 'disable' }]);

    const res = await handleWelcomeCommand(interaction, deps, {} as never);
    expect(res.data?.embeds?.[0].title).toContain('Welcome System Disabled');
    expect(settings['guild-123:welcome_channel_id']).toBe('');

    const config = getWelcomeConfig(deps, 'guild-123');
    expect(config.enabled).toBe(false);
  });

  it('views current welcome configuration', async () => {
    const { deps } = makeDeps({
      'guild-123:welcome_channel_id': '555',
      'guild-123:welcome_message': 'Hey {user}!',
    });
    const interaction = makeInteraction([{ name: 'action', value: 'view' }]);

    const res = await handleWelcomeCommand(interaction, deps, {} as never);
    expect(res.data?.embeds?.[0].title).toContain('Welcome Configuration');
    expect(res.data?.embeds?.[0].fields?.some((f) => f.name.includes('Channel') && f.value.includes('555'))).toBe(true);
  });

  it('delivers test welcome message when test action is executed', async () => {
    const { deps, sentMessages } = makeDeps({
      'guild-123:welcome_channel_id': 'chan-target',
      'guild-123:welcome_message': 'Welcome {mention}!',
    });
    const interaction = makeInteraction([{ name: 'action', value: 'test' }]);

    const res = await handleWelcomeCommand(interaction, deps, {} as never);
    expect(res.data?.embeds?.[0].title).toContain('Test Welcome Sent');
    expect(sentMessages.length).toBe(1);
    expect(sentMessages[0].channelId).toBe('chan-target');
  });
});
