import { describe, it, expect } from 'vitest';
import {
  createHelp,
  registerHelp,
  getAllHelp,
  getHelpByCategory,
  getCategoryEmoji,
  getCategoryLabel,
  helpCount,
} from '../../../HELIX/src/handlers/help-registrar.js';

describe('help-registrar — structure', () => {
  it('builds a CommandHelp entry with sensible usage default', () => {
    const help = createHelp('ping', 'Checks latency', 'utility');
    expect(help.name).toBe('ping');
    expect(help.description).toBe('Checks latency');
    expect(help.category).toBe('utility');
    expect(help.usage).toBe('>ping');
    expect(help.permissions).toEqual([]);
    expect(help.aliases).toBeUndefined();
  });

  it('supports explicit usage, permissions, aliases, and subcommands', () => {
    const help = createHelp('warn', 'Warn a user', 'moderation', {
      usage: '>warn <user> [reason]',
      permissions: ['ModerateMembers'],
      aliases: ['w'],
      subcommands: ['list', 'clear'],
    });
    expect(help.usage).toBe('>warn <user> [reason]');
    expect(help.permissions).toContain('ModerateMembers');
    expect(help.aliases).toEqual(['w']);
    expect(help.subcommands).toEqual(['list', 'clear']);
  });

  it('registerHelp deduplicates by name and groups by category order', () => {
    registerHelp(createHelp('ping', 'd', 'utility'));
    registerHelp(createHelp('warn', 'd2', 'moderation'));
    registerHelp(createHelp('ping', 'updated', 'utility'));

    const grouped = getHelpByCategory();
    const order = [...grouped.keys()];
    expect(order).toEqual(['moderation', 'utility', 'plugins', 'info', 'project', 'config']);

    const utilities = grouped.get('utility') || [];
    expect(utilities).toHaveLength(1);
    expect(utilities[0].description).toBe('updated');
    expect(helpCount()).toBeGreaterThanOrEqual(2);
  });

  it('getAllHelp returns at least what was registered', () => {
    // this test runs after the helper registrations so the registry has content
    expect(getAllHelp().length).toBe(helpCount());
  });

  it('maps known categories to emoji and labels', () => {
    expect(getCategoryEmoji('moderation')).toBe('🛡️');
    expect(getCategoryEmoji('utility')).toBe('🧰');
    expect(getCategoryEmoji('plugins')).toBe('🧩');
    expect(getCategoryEmoji('unknown')).toBe('📋');
    expect(getCategoryLabel('moderation')).toBe('Moderation Suite');
    expect(getCategoryLabel('unknown-cat')).toBe('unknown-cat');
  });
});