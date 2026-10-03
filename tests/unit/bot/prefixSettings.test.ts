/**
 * tests/unit/bot/prefixSettings.test.ts
 *
 * Unit tests for per-guild prefix settings and the feature toggle catalog,
 * backed by a real in-memory SQLite repository.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../../src/db/database.js';
import { Repository } from '../../../src/db/repository.js';
import type { AppDeps } from '../../../src/app.js';
import {
  DEFAULT_COMMAND_PREFIX,
  getGuildPrefix,
  getManagerRoleId,
  MANAGER_ROLE_SETTING_KEY,
  PREFIX_MAX_LENGTH,
  PREFIX_SETTING_KEY,
  type PrefixValidation,
  resetGuildPrefix,
  setGuildPrefix,
  setManagerRoleId,
  validateCommandPrefix,
} from '../../../src/bot/lib/prefix/settings.js';
import {
  familySettingKey,
  findPrefixFeature,
  isFeatureEnabled,
  listFeatureStates,
  PREFIX_FEATURES,
  type PrefixFeature,
  type PrefixFeatureState,
  setFeatureEnabled,
} from '../../../src/bot/lib/prefix/features.js';

const GUILD = 'guild-100';

function makeDeps(): { deps: AppDeps; db: Database } {
  const db = Database.open(':memory:');
  const repo = new Repository(db);
  return { deps: { config: {}, db, repo } as unknown as AppDeps, db };
}

/** Asserts a prefix is accepted and returns the normalised value. */
function expectValid(raw: string): string {
  const result: PrefixValidation = validateCommandPrefix(raw);
  if (!result.ok) throw new Error(`expected "${raw}" to be valid, got: ${result.error}`);
  return result.prefix;
}

/** Asserts a prefix is rejected and returns the reason. */
function expectInvalid(raw: string): string {
  const result: PrefixValidation = validateCommandPrefix(raw);
  if (result.ok) throw new Error(`expected "${raw}" to be rejected`);
  return result.error;
}

describe('validateCommandPrefix()', () => {
  it('accepts short punctuation prefixes', () => {
    for (const candidate of ['!', '?', '.', '$', 'h!', 'bot:']) {
      expect(expectValid(candidate)).toBe(candidate);
    }
  });

  it('trims surrounding whitespace from an otherwise valid prefix', () => {
    expect(expectValid('  ?  ')).toBe('?');
  });

  it('rejects the [prefix] documentation placeholder as literal input', () => {
    // `[prefix]` in the docs is placeholder notation for the guild's live prefix.
    // A user pasting it verbatim must not silently store it as a real prefix.
    expect(expectInvalid('[prefix]')).toContain(`at most ${PREFIX_MAX_LENGTH}`);
    expect(expectInvalid('[prefix]set prefix ?')).toContain(`at most ${PREFIX_MAX_LENGTH}`);
  });

  it('rejects empty prefixes', () => {
    expect(expectInvalid('')).toContain('cannot be empty');
    expect(expectInvalid('   ')).toContain('cannot be empty');
  });

  it('accepts a prefix at the length limit and rejects one past it', () => {
    expect(expectValid('x'.repeat(PREFIX_MAX_LENGTH))).toBe('x'.repeat(PREFIX_MAX_LENGTH));
    expect(expectInvalid('x'.repeat(PREFIX_MAX_LENGTH + 1))).toContain(`at most ${PREFIX_MAX_LENGTH}`);
  });

  it('rejects whitespace and mention-leading prefixes', () => {
    expect(expectInvalid('! !')).toContain('A prefix cannot contain spaces');
    expect(expectInvalid('<@')).toContain('start with');
    expect(expectInvalid('@bot')).toContain('start with');
    expect(expectInvalid('#bot')).toContain('start with');
  });
});

describe('guild prefix settings', () => {
  let ctx: { deps: AppDeps; db: Database };

  beforeEach(() => {
    ctx = makeDeps();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('defaults to the standard prefix when unset', () => {
    expect(getGuildPrefix(ctx.deps, GUILD)).toBe(DEFAULT_COMMAND_PREFIX);
  });

  it('persists and reads back a configured prefix', () => {
    setGuildPrefix(ctx.deps, GUILD, '?');
    expect(getGuildPrefix(ctx.deps, GUILD)).toBe('?');
  });

  it('scopes prefixes per guild', () => {
    setGuildPrefix(ctx.deps, GUILD, '?');
    expect(getGuildPrefix(ctx.deps, 'guild-200')).toBe(DEFAULT_COMMAND_PREFIX);
  });

  it('falls back to the default when a stored prefix is invalid', () => {
    ctx.deps.repo.setGuildSetting(GUILD, PREFIX_SETTING_KEY, 'way too long');
    expect(getGuildPrefix(ctx.deps, GUILD)).toBe(DEFAULT_COMMAND_PREFIX);
  });

  it('resets back to the default prefix', () => {
    setGuildPrefix(ctx.deps, GUILD, '?');
    resetGuildPrefix(ctx.deps, GUILD);
    expect(getGuildPrefix(ctx.deps, GUILD)).toBe(DEFAULT_COMMAND_PREFIX);
  });
});

describe('guild manager role settings', () => {
  let ctx: { deps: AppDeps; db: Database };

  beforeEach(() => {
    ctx = makeDeps();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('is null when unset', () => {
    expect(getManagerRoleId(ctx.deps, GUILD)).toBeNull();
  });

  it('persists a role id', () => {
    setManagerRoleId(ctx.deps, GUILD, '987654321098765432');
    expect(getManagerRoleId(ctx.deps, GUILD)).toBe('987654321098765432');
  });

  it('clears the role when passed null', () => {
    setManagerRoleId(ctx.deps, GUILD, '987654321098765432');
    setManagerRoleId(ctx.deps, GUILD, null);
    expect(getManagerRoleId(ctx.deps, GUILD)).toBeNull();
    expect(ctx.deps.repo.getGuildSetting(GUILD, MANAGER_ROLE_SETTING_KEY)).toBe('none');
  });
});

describe('feature toggle catalog', () => {
  let ctx: { deps: AppDeps; db: Database };

  beforeEach(() => {
    ctx = makeDeps();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('resolves features by id and by alias, case-insensitively', () => {
    expect(findPrefixFeature('reddit_feeds')?.id).toBe('reddit_feeds');
    expect(findPrefixFeature('REDDIT')?.id).toBe('reddit_feeds');
    expect(findPrefixFeature('patchnotes')?.id).toBe('patch_notes_feeds');
    expect(findPrefixFeature('nope')).toBeUndefined();
  });

  it('gives every feature a unique setting key', () => {
    const features: readonly PrefixFeature[] = PREFIX_FEATURES;
    const keys = features.map((f) => f.settingKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(features.map((f) => `feature_${f.id}`));
  });

  it('keeps every catalog family distinct from the per-feature keys', () => {
    const families = new Set(PREFIX_FEATURES.map((f) => f.family));
    expect(families).toContain('feeds');
    expect(families).toContain('streamalerts');
    expect(families).toContain('welcome');
    expect(families).toContain('ticket');
  });

  it('treats features as enabled by default', () => {
    expect(isFeatureEnabled(ctx.deps, GUILD, 'reddit_feeds')).toBe(true);
  });

  it('persists a disabled feature and reports it', () => {
    const resolved = setFeatureEnabled(ctx.deps, GUILD, 'reddit_feeds', false);
    expect(resolved?.id).toBe('reddit_feeds');
    expect(isFeatureEnabled(ctx.deps, GUILD, 'reddit_feeds')).toBe(false);
  });

  it('returns null when toggling an unknown feature', () => {
    expect(setFeatureEnabled(ctx.deps, GUILD, 'not_a_feature', false)).toBeNull();
  });

  it('accepts aliases when toggling', () => {
    setFeatureEnabled(ctx.deps, GUILD, 'twitch', false);
    expect(isFeatureEnabled(ctx.deps, GUILD, 'twitch_feeds')).toBe(false);
  });

  it('keeps the feed family gate enabled while any member feature is on', () => {
    setFeatureEnabled(ctx.deps, GUILD, 'reddit_feeds', false);
    expect(ctx.deps.repo.getGuildSetting(GUILD, familySettingKey('feeds'))).toBe('1');

    setFeatureEnabled(ctx.deps, GUILD, 'game_feeds', false);
    expect(ctx.deps.repo.getGuildSetting(GUILD, familySettingKey('feeds'))).toBe('1');
  });

  it('disables the feed family gate only when every member feature is off', () => {
    for (const f of PREFIX_FEATURES.filter((x) => x.family === 'feeds')) {
      setFeatureEnabled(ctx.deps, GUILD, f.id, false);
    }
    expect(ctx.deps.repo.getGuildSetting(GUILD, familySettingKey('feeds'))).toBe('0');
  });

  it('re-enables the feed family gate when a single member comes back', () => {
    for (const f of PREFIX_FEATURES.filter((x) => x.family === 'feeds')) {
      setFeatureEnabled(ctx.deps, GUILD, f.id, false);
    }
    expect(ctx.deps.repo.getGuildSetting(GUILD, familySettingKey('feeds'))).toBe('0');

    setFeatureEnabled(ctx.deps, GUILD, 'news_feeds', true);
    expect(ctx.deps.repo.getGuildSetting(GUILD, familySettingKey('feeds'))).toBe('1');
  });

  it('keeps the welcome gate in sync with the welcome feature', () => {
    setFeatureEnabled(ctx.deps, GUILD, 'welcome', false);
    expect(ctx.deps.repo.getGuildSetting(GUILD, 'feature_welcome')).toBe('0');
  });

  it('keeps the ticket gate in sync with the tickets feature', () => {
    setFeatureEnabled(ctx.deps, GUILD, 'tickets', false);
    // The ticket dispatcher reads feature_ticket directly.
    expect(ctx.deps.repo.getGuildSetting(GUILD, 'feature_ticket')).toBe('0');
  });

  it('keeps the stream alerts gate in sync', () => {
    setFeatureEnabled(ctx.deps, GUILD, 'twitch_feeds', false);
    expect(ctx.deps.repo.getGuildSetting(GUILD, 'feature_streamalerts')).toBe('1');
  });

  it('lists a state entry for every catalog feature', () => {
    const states: readonly PrefixFeatureState[] = listFeatureStates(ctx.deps, GUILD);
    expect(states).toHaveLength(PREFIX_FEATURES.length);
    expect(states.every((s) => s.enabled === true)).toBe(true);
  });

  it('reports the family gate alongside each feature state', () => {
    for (const f of PREFIX_FEATURES.filter((x) => x.family === 'feeds')) {
      setFeatureEnabled(ctx.deps, GUILD, f.id, false);
    }

    const states: readonly PrefixFeatureState[] = listFeatureStates(ctx.deps, GUILD);
    expect(states.filter((s) => s.family === 'feeds').every((s) => s.familyEnabled === false)).toBe(true);
    expect(states.find((s) => s.id === 'welcome')?.familyEnabled).toBe(true);
  });
});
