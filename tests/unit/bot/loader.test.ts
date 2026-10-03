/**
 * tests/unit/bot/loader.test.ts
 *
 * Verifies the dynamic command loader (Rule 06): it discovers real command
 * modules from the filesystem and routes the `prefix` category into the prefix
 * registry instead of the slash registry, with no static command index.
 *
 * `loadAllCommands()` caches its result per module instance, so discovery is
 * asserted once against the live `src/bot/commands/` tree.
 */
import { describe, it, expect, beforeAll } from 'vitest';

import { loadAllCommands } from '../../../src/bot/handlers/loader.js';
import { getAllCommands } from '../../../src/bot/handlers/registry.js';
import { getAllPrefixCommands, getPrefixCommand } from '../../../src/bot/handlers/prefix.js';

beforeAll(async () => {
  await loadAllCommands();
});

describe('loadAllCommands()', () => {
  it('discovers slash commands from the non-prefix categories', () => {
    const names = getAllCommands().map((c) => c.def.name);
    expect(names.length).toBeGreaterThan(0);

    // One command from each wired category directory, so a category
    // accidentally dropped from COMMAND_CATEGORIES fails here.
    expect(names).toContain('role');
    expect(names).toContain('announce');
    expect(names).toContain('stats');
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