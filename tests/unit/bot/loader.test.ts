/**
 * tests/unit/bot/loader.test.ts
 *
 * Verifies the dynamic command loader (Rule 06): it discovers real command
 * modules from the filesystem and routes the `prefix` category into the prefix
 * registry instead of the slash registry, with no static command index.
 *
 * This file also pins the project directive that withdrawn action-style slash
 * commands stay withdrawn — see `WITHDRAWN_ACTION_COMMANDS`.
 *
 * `loadAllCommands()` caches its result per module instance, so discovery is
 * asserted once against the live `src/bot/commands/` tree.
 */
import { describe, it, expect, beforeAll } from 'vitest';

import { loadAllCommands } from '../../../src/bot/handlers/loader.js';
import { getAllCommands } from '../../../src/bot/handlers/registry.js';
import { getAllPrefixCommands, getPrefixCommand } from '../../../src/bot/handlers/prefix.js';

/**
 * Slash commands that must never be registered with Discord.
 *
 * These action commands were withdrawn because they never worked reliably, and
 * are being replaced by the prefix command system. Their modules remain in the
 * tree purely as reference logic for that rewrite, and intentionally export no
 * `BotCommand`. Adding one "to fix discovery" would re-register commands the
 * project has deliberately retired.
 */
const WITHDRAWN_ACTION_COMMANDS = ['rss', 'youtube', 'twitch', 'free-games', 'reddit', 'welcome', 'ticket'] as const;

beforeAll(async () => {
  await loadAllCommands();
});

describe('loadAllCommands()', () => {
  it('discovers slash commands from the wired categories', () => {
    const names = getAllCommands().map((c) => c.def.name);
    expect(names.length).toBeGreaterThan(0);

    // One command from each wired category directory, so a category
    // accidentally dropped from COMMAND_CATEGORIES fails here.
    expect(names).toContain('role');
    expect(names).toContain('announce');
    expect(names).toContain('stats');
  });

  it('does not register withdrawn action commands as slash commands', () => {
    const names = getAllCommands().map((c) => c.def.name);
    for (const withdrawn of WITHDRAWN_ACTION_COMMANDS) {
      expect(names, `/${withdrawn} is withdrawn and must not be re-registered`).not.toContain(withdrawn);
    }
  });

  it('registers the prefix category into the prefix registry', () => {
    const names = getAllPrefixCommands().map((c) => c.name);
    expect(names).toContain('set');
    expect(names).toContain('help');
  });

  it('keeps prefix modules out of the slash registry', () => {
    // A prefix module exports a flat name/usage/execute shape; a slash command
    // always carries a `def`. Nothing with `usage` may reach the slash registry.
    const slashEntries = getAllCommands() as unknown as Array<Record<string, unknown>>;
    expect(slashEntries.some((c) => 'usage' in c)).toBe(false);
    expect(slashEntries.every((c) => 'def' in c && 'execute' in c)).toBe(true);
  });

  it('registers aliases so they resolve without a hardcoded table', () => {
    expect(getPrefixCommand('config')?.name).toBe('set');
    expect(getPrefixCommand('commands')?.name).toBe('help');
  });

  it('is idempotent across repeated calls', async () => {
    const before = getAllPrefixCommands().length;
    await loadAllCommands();
    expect(getAllPrefixCommands()).toHaveLength(before);
  });
});