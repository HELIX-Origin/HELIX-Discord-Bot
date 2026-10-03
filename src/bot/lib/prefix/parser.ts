/**
 * src/bot/lib/prefix/parser.ts
 *
 * Invocation parsing for prefix commands: splits a raw message into a prefix,
 * a command name, and tokenized arguments, and resolves Discord mentions or bare
 * snowflakes into usable IDs.
 *
 * Tokenization supports double-quoted arguments so free-text payloads such as
 * welcome or ticket messages survive spaces.
 */

import type { GuildMember } from 'discord.js';

export interface PrefixInvocation {
  /** The guild's prefix this message matched. */
  readonly prefix: string;
  /** Lowercased command name. */
  readonly command: string;
  /** Tokenized arguments, with quotes removed. */
  readonly args: readonly string[];
  /** Raw remainder after the command name, before tokenization. */
  readonly rawArgs: string;
  /** Original message content. */
  readonly content: string;
}

/**
 * Splits an argument string on whitespace, honouring double-quoted segments.
 *
 * A backslash escapes the following character inside and outside quotes.
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let escaped = false;
  let started = false;

  for (const char of input) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      started = true;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      started = true;
      continue;
    }
    if (!inQuotes && /\s/u.test(char)) {
      if (started) {
        tokens.push(current);
        current = '';
        started = false;
      }
      continue;
    }
    current += char;
    started = true;
  }

  if (started) tokens.push(current);
  return tokens;
}

/**
 * Parses a message into a prefix invocation.
 *
 * Returns null when the content does not start with the prefix, or when the
 * prefix is immediately followed by whitespace or end-of-string (an empty
 * invocation is left for the dispatcher to ignore).
 */
export function parsePrefixInvocation(content: string, prefix: string): PrefixInvocation | null {
  if (!prefix || !content.startsWith(prefix)) return null;

  const remainder = content.slice(prefix.length).replace(/^\s+/u, '');
  if (!remainder) return null;

  const match = /^(\S+)\s*([\s\S]*)$/u.exec(remainder);
  if (!match) return null;

  const command = (match[1] ?? '').toLowerCase();
  if (!command) return null;

  const rawArgs = (match[2] ?? '').trim();
  return {
    prefix,
    command,
    args: tokenize(rawArgs),
    rawArgs,
    content,
  };
}

const SNOWFLAKE_PATTERN = /^\d{16,20}$/u;

/** Shared trailing `>` tolerance for the bracketed mention forms. */
const TRAILING_BRACKET = '>?';

const CHANNEL_TOKEN_PATTERN = new RegExp(`^(?:<#|#)?(\\d{16,20})${TRAILING_BRACKET}$`, 'u');
const ROLE_TOKEN_PATTERN = new RegExp(`^(?:<@&|@&?|role:)?(\\d{16,20})${TRAILING_BRACKET}$`, 'u');
const USER_TOKEN_PATTERN = new RegExp(`^(?:<@|@|user:)?(\\d{16,20})${TRAILING_BRACKET}$`, 'u');

/**
 * Normalizes a channel token to a snowflake.
 *
 * Accepts `<#123>`, `#123`, and a bare `123`.
 */
export function resolveChannelId(token: string | undefined | null): string | null {
  if (!token) return null;
  return CHANNEL_TOKEN_PATTERN.exec(token.trim())?.[1] ?? null;
}

/**
 * Normalizes a role token to a snowflake.
 *
 * Accepts `<@&123>`, `@123`, and a bare `123`.
 */
export function resolveRoleId(token: string | undefined | null): string | null {
  if (!token) return null;
  return ROLE_TOKEN_PATTERN.exec(token.trim())?.[1] ?? null;
}

/**
 * Normalizes a user token to a snowflake.
 *
 * Accepts `<@123>`, `@123`, and a bare `123`.
 */
export function resolveUserId(token: string | undefined | null): string | null {
  if (!token) return null;
  return USER_TOKEN_PATTERN.exec(token.trim())?.[1] ?? null;
}

/** True when the token looks like a Discord snowflake in any supported form. */
export function isSnowflake(token: string | undefined | null): boolean {
  if (!token) return false;
  return SNOWFLAKE_PATTERN.test(token.trim());
}

/**
 * Looks up a role's display name in the member's cached guild roles.
 *
 * Returns null when the member could not be resolved or the role is not cached.
 * Every step is optional-chained so a partially populated member degrades to null
 * rather than throwing inside a command.
 */
export function findCachedRoleName(member: GuildMember | null | undefined, roleId: string): string | null {
  return member?.guild?.roles?.cache?.get(roleId)?.name ?? null;
}
