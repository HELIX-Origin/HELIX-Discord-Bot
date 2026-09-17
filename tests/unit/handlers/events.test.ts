/**
 * tests/unit/handlers/events.test.ts
 *
 * Unit tests for interaction conversion (toDiscordInteraction, transformOptions)
 * and interaction dispatch handling.
 */
import { describe, it, expect } from 'vitest';
import { toDiscordInteraction, transformOptions } from '../../../src/bot/handlers/events.js';
import type { ChatInputCommandInteraction, CommandInteractionOption } from 'discord.js';

describe('transformOptions', () => {
  it('returns undefined when options are empty or undefined', () => {
    expect(transformOptions(undefined)).toBeUndefined();
    expect(transformOptions([])).toBeUndefined();
  });

  it('transforms flat options correctly', () => {
    const rawOptions = [
      { name: 'query', type: 3, value: 'Never Gonna Give You Up' },
      { name: 'volume', type: 4, value: 75 },
      { name: 'filter', type: 5, value: true },
    ] as unknown as CommandInteractionOption[];

    const transformed = transformOptions(rawOptions);
    expect(transformed).toEqual([
      { name: 'query', type: 3, value: 'Never Gonna Give You Up' },
      { name: 'volume', type: 4, value: 75 },
      { name: 'filter', type: 5, value: true },
    ]);
  });

  it('transforms resolved user/channel/role IDs when value is on resolved objects', () => {
    const rawOptions = [
      { name: 'user', type: 6, user: { id: 'user-123' } },
      { name: 'channel', type: 7, channel: { id: 'channel-456' } },
      { name: 'role', type: 8, role: { id: 'role-789' } },
    ] as unknown as CommandInteractionOption[];

    const transformed = transformOptions(rawOptions);
    expect(transformed).toEqual([
      { name: 'user', type: 6, value: 'user-123' },
      { name: 'channel', type: 7, value: 'channel-456' },
      { name: 'role', type: 8, value: 'role-789' },
    ]);
  });

  it('transforms nested subcommand options recursively', () => {
    const rawOptions = [
      {
        name: 'add',
        type: 1, // SUB_COMMAND
        options: [
          { name: 'user', type: 6, value: 'user-123' },
          { name: 'role', type: 8, value: 'role-456' },
        ],
      },
    ] as unknown as CommandInteractionOption[];

    const transformed = transformOptions(rawOptions);
    expect(transformed).toEqual([
      {
        name: 'add',
        type: 1,
        options: [
          { name: 'user', type: 6, value: 'user-123' },
          { name: 'role', type: 8, value: 'role-456' },
        ],
      },
    ]);
  });
});

describe('toDiscordInteraction', () => {
  it('converts a ChatInputCommandInteraction into a DiscordInteraction format', () => {
    const fakeInteraction = {
      id: 'int-999',
      applicationId: 'app-888',
      isAutocomplete: () => false,
      guildId: 'guild-777',
      channelId: 'ch-666',
      token: 'tok-555',
      version: 1,
      commandId: 'cmd-444',
      commandName: 'play',
      user: {
        id: 'user-111',
        username: 'helixuser',
        globalName: 'Helix User',
        avatar: 'avatarhash',
      },
      member: {
        user: {
          id: 'user-111',
          username: 'helixuser',
          globalName: 'Helix User',
          avatar: 'avatarhash',
        },
      },
      memberPermissions: {
        bitfield: 8n,
      },
      options: {
        data: [
          { name: 'query', type: 3, value: 'lofi hip hop' },
        ],
      },
    } as unknown as ChatInputCommandInteraction;

    const result = toDiscordInteraction(fakeInteraction);

    expect(result.id).toBe('int-999');
    expect(result.application_id).toBe('app-888');
    expect(result.type).toBe(2);
    expect(result.guild_id).toBe('guild-777');
    expect(result.channel_id).toBe('ch-666');
    expect(result.token).toBe('tok-555');
    expect(result.user?.id).toBe('user-111');
    expect(result.member?.permissions).toBe('8');
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe('cmd-444');
    expect(result.data?.name).toBe('play');
    expect(result.data?.options).toEqual([
      { name: 'query', type: 3, value: 'lofi hip hop' },
    ]);
  });

  it('handles DM interactions with no guildId and no member', () => {
    const fakeInteraction = {
      id: 'int-dm',
      applicationId: 'app-888',
      isAutocomplete: () => false,
      guildId: null,
      channelId: 'dm-channel',
      token: 'tok-dm',
      version: 1,
      commandId: 'cmd-help',
      commandName: 'help',
      user: {
        id: 'user-222',
        username: 'dmuser',
        globalName: null,
        avatar: null,
      },
      member: null,
      memberPermissions: null,
      options: {
        data: [],
      },
    } as unknown as ChatInputCommandInteraction;

    const result = toDiscordInteraction(fakeInteraction);

    expect(result.guild_id).toBeUndefined();
    expect(result.member).toBeUndefined();
    expect(result.data?.name).toBe('help');
    expect(result.data?.options).toBeUndefined();
  });
});
