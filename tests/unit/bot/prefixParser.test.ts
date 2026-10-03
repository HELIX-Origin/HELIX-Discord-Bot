/**
 * tests/unit/bot/prefixParser.test.ts
 *
 * Unit tests for prefix command invocation parsing, argument tokenization, and
 * Discord mention / snowflake resolution.
 */
import { describe, it, expect } from 'vitest';
import {
  isSnowflake,
  parsePrefixInvocation,
  resolveChannelId,
  resolveRoleId,
  resolveUserId,
  tokenize,
} from '../../../src/bot/lib/prefix/parser.js';

describe('tokenize()', () => {
  it('splits on whitespace and collapses runs', () => {
    expect(tokenize('  one   two\tthree\nfour ')).toEqual(['one', 'two', 'three', 'four']);
  });

  it('returns an empty array for blank input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('    ')).toEqual([]);
  });

  it('preserves spaces inside double quotes', () => {
    expect(tokenize('message "Welcome to the server, {user}!"')).toEqual([
      'message',
      'Welcome to the server, {user}!',
    ]);
  });

  it('joins adjacent quoted segments separated by a space', () => {
    expect(tokenize('"hello there" "general kenobi"')).toEqual(['hello there', 'general kenobi']);
  });

  it('honours backslash escapes inside and outside quotes', () => {
    expect(tokenize('say \\"hi\\" now')).toEqual(['say', '"hi"', 'now']);
    expect(tokenize('"a \\"quoted\\" word"')).toEqual(['a "quoted" word']);
  });

  it('emits an empty token for an explicitly empty quoted string', () => {
    expect(tokenize('before "" after')).toEqual(['before', '', 'after']);
  });
});

describe('parsePrefixInvocation()', () => {
  it('parses command and arguments', () => {
    const result = parsePrefixInvocation('!set prefix ?', '!');
    expect(result).not.toBeNull();
    expect(result?.command).toBe('set');
    expect(result?.args).toEqual(['prefix', '?']);
    expect(result?.prefix).toBe('!');
  });

  it('lowercases the command name but preserves argument casing', () => {
    const result = parsePrefixInvocation('!SET Manager_Role @Managers', '!');
    expect(result?.command).toBe('set');
    expect(result?.args).toEqual(['Manager_Role', '@Managers']);
  });

  it('supports multi-character and non-punctuation prefixes', () => {
    const result = parsePrefixInvocation('hx!help', 'hx!');
    expect(result?.command).toBe('help');
    expect(result?.args).toEqual([]);
  });

  it('is case sensitive about the prefix itself', () => {
    expect(parsePrefixInvocation('!help', '!')).not.toBeNull();
    expect(parsePrefixInvocation('$help', '$')).not.toBeNull();
  });

  it('returns null when the content does not start with the prefix', () => {
    expect(parsePrefixInvocation('hello world', '!')).toBeNull();
    expect(parsePrefixInvocation('prefix!help', '!')).toBeNull();
  });

  it('returns null when nothing follows the prefix', () => {
    expect(parsePrefixInvocation('!', '!')).toBeNull();
    expect(parsePrefixInvocation('!   ', '!')).toBeNull();
  });

  it('returns null for an empty prefix', () => {
    expect(parsePrefixInvocation('!help', '')).toBeNull();
  });

  it('handles a bare command with no trailing whitespace', () => {
    const result = parsePrefixInvocation('!help', '!');
    expect(result?.command).toBe('help');
    expect(result?.rawArgs).toBe('');
  });

  it('keeps the raw remainder for multi-word payloads', () => {
    const result = parsePrefixInvocation('!welcome message "Welcome aboard, {user}"', '!');
    expect(result?.command).toBe('welcome');
    expect(result?.rawArgs).toBe('message "Welcome aboard, {user}"');
    expect(result?.args).toEqual(['message', 'Welcome aboard, {user}']);
  });
});

describe('mention and snowflake resolution', () => {
  const CHANNEL = '123456789012345678';
  const ROLE = '987654321098765432';
  const USER = '111111111111111111';

  it('resolves channel tokens', () => {
    expect(resolveChannelId(`<#${CHANNEL}>`)).toBe(CHANNEL);
    expect(resolveChannelId(`#${CHANNEL}`)).toBe(CHANNEL);
    expect(resolveChannelId(CHANNEL)).toBe(CHANNEL);
  });

  it('resolves role tokens', () => {
    expect(resolveRoleId(`<@&${ROLE}>`)).toBe(ROLE);
    expect(resolveRoleId(`@${ROLE}`)).toBe(ROLE);
    expect(resolveRoleId(ROLE)).toBe(ROLE);
  });

  it('resolves user tokens', () => {
    expect(resolveUserId(`<@${USER}>`)).toBe(USER);
    expect(resolveUserId(`@${USER}`)).toBe(USER);
    expect(resolveUserId(USER)).toBe(USER);
  });

  it('rejects user mentions when resolving roles', () => {
    expect(resolveRoleId(`<@${USER}>`)).toBeNull();
  });

  it('rejects role mentions when resolving users', () => {
    expect(resolveUserId(`<@&${ROLE}>`)).toBeNull();
  });

  it('rejects non-snowflake and empty input', () => {
    expect(resolveChannelId('general')).toBeNull();
    expect(resolveRoleId('Managers')).toBeNull();
    expect(resolveUserId(undefined)).toBeNull();
    expect(resolveChannelId(null)).toBeNull();
    expect(resolveRoleId('')).toBeNull();
  });

  it('recognises bare snowflakes', () => {
    expect(isSnowflake(USER)).toBe(true);
    expect(isSnowflake(`<#${CHANNEL}>`)).toBe(false);
    expect(isSnowflake('123')).toBe(false);
  });
});
