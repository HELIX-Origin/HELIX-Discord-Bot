/**
 * tests/unit/admin/command-disable.test.ts
 *
 * Unit tests for `isCommandDisabled()` from `src/bot/handlers/registry.ts`.
 * Validates global feature flags, guild-level command toggles, and edge cases.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerCommand,
  isCommandDisabled,
  type BotCommand,
} from '../../../src/bot/handlers/registry.js';
import type { AppDeps } from '../../../src/app.js';

function makeMockDeps(
  guildSettings: Record<string, string> = {},
  featureFlags: { adminEnabled?: boolean } = {},
): AppDeps {
  return {
    config: {
      features: {
        administrationEnabled: featureFlags.adminEnabled ?? true,
      },
    },
    repo: {
      getGuildSetting(guildId: string, key: string) {
        return guildSettings[`${guildId}:${key}`] ?? null;
      },
    },
  } as unknown as AppDeps;
}

describe('isCommandDisabled()', () => {
  const mockTestCmd: BotCommand = {
    def: {
      name: 'testcommand',
      description: 'A test command for disable checking',
    },
    category: 'utility',
    execute: async () => ({ type: 4 }),
  };

  const mockAdminCmd: BotCommand = {
    def: {
      name: 'testadmincmd',
      description: 'An admin command gated by feature flag',
    },
    category: 'admin',
    isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
    execute: async () => ({ type: 4 }),
  };

  beforeEach(() => {
    registerCommand(mockTestCmd);
    registerCommand(mockAdminCmd);
  });

  it('returns true for unknown / non-existent commands', () => {
    const deps = makeMockDeps();
    expect(isCommandDisabled('guild-1', 'nonexistent_command', deps)).toBe(true);
  });

  it('returns false when command exists and is not disabled anywhere', () => {
    const deps = makeMockDeps();
    expect(isCommandDisabled('guild-1', 'testcommand', deps)).toBe(false);
  });

  it('is case-insensitive for command name', () => {
    const deps = makeMockDeps();
    expect(isCommandDisabled('guild-1', 'TestCommand', deps)).toBe(false);
  });

  it('returns true when command is disabled globally via isEnabled', () => {
    const deps = makeMockDeps({}, { adminEnabled: false });
    expect(isCommandDisabled('guild-1', 'testadmincmd', deps)).toBe(true);
  });

  it('returns false when command is enabled globally via isEnabled', () => {
    const deps = makeMockDeps({}, { adminEnabled: true });
    expect(isCommandDisabled('guild-1', 'testadmincmd', deps)).toBe(false);
  });

  it('returns true when command is explicitly disabled for a guild in repo', () => {
    const deps = makeMockDeps({
      'guild-1:cmd_disabled_testcommand': '1',
    });
    expect(isCommandDisabled('guild-1', 'testcommand', deps)).toBe(true);
  });

  it('returns false for another guild when disabled only on a specific guild', () => {
    const deps = makeMockDeps({
      'guild-1:cmd_disabled_testcommand': '1',
    });
    expect(isCommandDisabled('guild-2', 'testcommand', deps)).toBe(false);
  });

  it('returns false when guild setting is 0 (explicitly enabled)', () => {
    const deps = makeMockDeps({
      'guild-1:cmd_disabled_testcommand': '0',
    });
    expect(isCommandDisabled('guild-1', 'testcommand', deps)).toBe(false);
  });

  it('works when guildId is null or undefined (DM context)', () => {
    const deps = makeMockDeps();
    expect(isCommandDisabled(null, 'testcommand', deps)).toBe(false);
    expect(isCommandDisabled(undefined, 'testcommand', deps)).toBe(false);
  });
});
