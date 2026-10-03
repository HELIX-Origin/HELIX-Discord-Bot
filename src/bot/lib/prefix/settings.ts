/**
 * src/bot/lib/prefix/settings.ts
 *
 * Per-guild prefix command settings: the configurable command prefix and the
 * optional manager role that grants prefix command access without requiring a
 * Discord permission bit.
 *
 * Persisted through the write-through repository as guild settings, so the
 * dashboard and the bot observe the same values immediately.
 */

import type { AppDeps } from '../../../app.js';

/** Prefix used by any guild that has never configured one. */
export const DEFAULT_COMMAND_PREFIX = '!';

/** Guild setting key holding the guild's command prefix. */
export const PREFIX_SETTING_KEY = 'command_prefix';

/** Guild setting key holding the guild's manager role snowflake. */
export const MANAGER_ROLE_SETTING_KEY = 'manager_role';

/**
 * Prefixes are kept short so they stay practical to type and are unlikely to
 * collide with ordinary conversation.
 */
export const PREFIX_MAX_LENGTH = 5;

/**
 * A prefix must be a short run of non-whitespace characters.
 *
 * Mentions (`<`, `@`) are rejected so a prefix can never be confused with — or
 * silently swallow — a user, role, or channel mention at the start of a message.
 */
const VALID_PREFIX_PATTERN = /^[^\s<@#][^\s]*$/u;

export type PrefixValidation = { ok: true; prefix: string } | { ok: false; error: string };

/**
 * Validates and normalises a candidate command prefix.
 *
 * `[prefix]` in the documentation is placeholder notation for the guild's live
 * prefix, not a literal value, so it is not accepted as input.
 */
export function validateCommandPrefix(raw: string): PrefixValidation {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, error: 'A prefix cannot be empty. Example: `!set prefix ?`' };
  }
  if (trimmed.length > PREFIX_MAX_LENGTH) {
    return {
      ok: false,
      error: `A prefix can be at most ${PREFIX_MAX_LENGTH} characters (got ${trimmed.length}).`,
    };
  }
  if (!VALID_PREFIX_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error: 'A prefix cannot contain spaces or start with `<`, `@`, or `#`.',
    };
  }

  return { ok: true, prefix: trimmed };
}

/** Returns the guild's configured command prefix, falling back to the default. */
export function getGuildPrefix(deps: AppDeps, guildId: string): string {
  const stored = deps.repo.getGuildSetting(guildId, PREFIX_SETTING_KEY);
  if (!stored) return DEFAULT_COMMAND_PREFIX;
  const validated = validateCommandPrefix(stored);
  return validated.ok ? validated.prefix : DEFAULT_COMMAND_PREFIX;
}

/** Persists a validated command prefix for the guild. */
export function setGuildPrefix(deps: AppDeps, guildId: string, prefix: string): void {
  deps.repo.setGuildSetting(guildId, PREFIX_SETTING_KEY, prefix);
}

/**
 * Resets the guild to the default prefix.
 *
 * `SettingsRepository` has no delete primitive, so the default is stored
 * explicitly — reading it back through `getGuildPrefix` is equivalent to the
 * default and keeps the reset observable in the dashboard.
 */
export function resetGuildPrefix(deps: AppDeps, guildId: string): void {
  deps.repo.setGuildSetting(guildId, PREFIX_SETTING_KEY, DEFAULT_COMMAND_PREFIX);
}

/** Returns the guild's manager role snowflake, or null when unset. */
export function getManagerRoleId(deps: AppDeps, guildId: string): string | null {
  const stored = deps.repo.getGuildSetting(guildId, MANAGER_ROLE_SETTING_KEY);
  const trimmed = stored?.trim();
  return trimmed && trimmed !== 'none' ? trimmed : null;
}

/**
 * Sets or clears the guild's manager role.
 *
 * Passing null clears the role, stored as the sentinel `none` because the
 * settings repository only persists string values.
 */
export function setManagerRoleId(deps: AppDeps, guildId: string, roleId: string | null): void {
  deps.repo.setGuildSetting(guildId, MANAGER_ROLE_SETTING_KEY, roleId?.trim() || 'none');
}
