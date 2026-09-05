import { describe, it, expect } from 'vitest';
import {
  BOT_NAME,
  BOT_VERSION,
  DEFAULT_PREFIX,
  MAX_PREFIX_LENGTH,
  COMMAND_CATEGORIES,
  DISCORD_LIMITS,
  RATE_LIMITS,
  MODERATION,
  TICKETING,
  SCAFFOLDING,
  PLUGINS,
  COLORS,
  DATABASE,
  HTTP_SERVER,
  GITHUB,
  PATTERNS,
} from '../../HELIX/src/config.js';

describe('src/config.ts — centralized bot configuration', () => {
  it('defines bot identity constants', () => {
    expect(BOT_NAME).toBe('HELIX');
    expect(BOT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('defines the default prefix and its length limit', () => {
    expect(DEFAULT_PREFIX).toBe('>');
    expect(MAX_PREFIX_LENGTH).toBeGreaterThanOrEqual(1);
  });

  it('declares the canonical command categories', () => {
    expect(COMMAND_CATEGORIES).toEqual([
      'moderation',
      'utility',
      'plugins',
      'info',
      'project',
      'config',
    ]);
  });

  it('frozen config objects cannot be mutated at runtime', () => {
    expect(Object.isFrozen(DISCORD_LIMITS)).toBe(true);
    expect(Object.isFrozen(RATE_LIMITS)).toBe(true);
    expect(Object.isFrozen(MODERATION)).toBe(true);
    expect(Object.isFrozen(TICKETING)).toBe(true);
    expect(Object.isFrozen(SCAFFOLDING)).toBe(true);
    expect(Object.isFrozen(PLUGINS)).toBe(true);
    expect(Object.isFrozen(DATABASE)).toBe(true);
    expect(Object.isFrozen(GITHUB)).toBe(true);
    expect(Object.isFrozen(PATTERNS)).toBe(true);
  });

  it('ships Discord-safe embed constants', () => {
    expect(DISCORD_LIMITS.MAX_MESSAGE_LENGTH).toBe(2000);
    expect(DISCORD_LIMITS.MAX_EMBED_FIELDS).toBe(25);
    expect(DISCORD_LIMITS.MAX_EMBED_DESCRIPTION).toBe(4096);
  });

  it('keeps moderation purge limits bounded', () => {
    expect(MODERATION.MIN_PURGE_MESSAGES).toBeGreaterThanOrEqual(1);
    expect(MODERATION.MAX_PURGE_MESSAGES).toBeGreaterThanOrEqual(MODERATION.MIN_PURGE_MESSAGES);
    expect(MODERATION.MAX_PURGE_MESSAGES).toBeLessThanOrEqual(100);
  });

  it('defines the plugin system baseline', () => {
    expect(PLUGINS.BUILTIN_REPO).toBe('helix-origin');
    expect(PLUGINS.MANIFEST_FILENAME).toBe('plugin.json');
    expect(PLUGINS.CONFIG_FILENAME).toBe('config.json');
  });

  it('references the canonical repository', () => {
    expect(GITHUB.REPO_OWNER).toBe('HELIX-Origin');
    expect(GITHUB.API_BASE).toBe('https://api.github.com');
    expect(GITHUB.RAW_BASE).toBe('https://raw.githubusercontent.com');
  });

  it('provides useful regex patterns', () => {
    expect(PATTERNS.SNOWFLAKE.test('123456789012345678')).toBe(true);
    expect(PATTERNS.SNOWFLAKE.test('short')).toBe(false);
    expect(PATTERNS.HEX_COLOR.test('#abc123')).toBe(true);
    expect(PATTERNS.URL.test('https://example.com')).toBe(true);
    expect(PATTERNS.EMAIL.test('dev@helix.dev')).toBe(true);
  });

  it('exposes a full color palette for embeds', () => {
    expect(COLORS.PRIMARY).toBe(0x00d2ff);
    expect(COLORS.ERROR).toBe(0xff3333);
    expect(COLORS.SUCCESS).toBe(0x00ff88);
  });
});