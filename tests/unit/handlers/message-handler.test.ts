import { describe, it, expect } from 'vitest';
import {
  interpolateString,
  getMessage,
  getMessageObject,
  hasMessage,
  createEmbed,
  formatError,
  formatSuccess,
  getCategory,
  reloadMessages,
} from '../../../HELIX/src/handlers/message-handler.js';

describe('message-handler — interpolation', () => {
  it('replaces templated placeholders with provided values', () => {
    expect(interpolateString('Hello {name}', { name: 'HELIX' })).toBe('Hello HELIX');
    expect(interpolateString('{a}-{b}-{a}', { a: 'x', b: 'y' })).toBe('x-y-x');
  });

  it('keeps unknown placeholders verbatim', () => {
    expect(interpolateString('ping {missing}', {})).toBe('ping {missing}');
  });

  it('coerces non-string values to strings', () => {
    expect(interpolateString('count={n}', { n: 42 })).toBe('count=42');
  });

  it('returns empty string for non-string input', () => {
    expect(interpolateString('' as any, {})).toBe('');
  });
});

describe('message-handler — lookups against messages.json', () => {
  it('loads the canonical messages schema', () => {
    const topLevel = getCategory('utility');
    expect(Object.keys(topLevel)).toEqual([
      'ping',
      'avatar',
      'serverinfo',
      'userinfo',
      'poll',
      'snowflake',
      'remind',
    ]);
  });

  it('resolves string and object-based messages with interpolation', () => {
    expect(getMessage('errors.generic')).toContain('An unexpected error occurred');
    expect(getMessage('moderation.purge.embed.description', { count: 5 })).toContain('5');
    expect(getMessage('config.set.embed_success', { setting: 'X', value: 'Y' }).length).toBeGreaterThan(0);
  });

  it('injects the prefix variable by default', () => {
    expect(getMessage('info.help.embed.description', {}, '>')).toContain('>');
  });

  it('fallbacks to a provided fallback when the key is missing', () => {
    expect(getMessage('nope.missing', {}, '>', 'custom {prefix}')).toBe('custom >');
  });

  it('reports missing keys that were never registered', () => {
    expect(hasMessage('does.not.exist')).toBe(false);
    expect(hasMessage('utility.ping')).toBe(true);
  });

  it('returns deep-cloned message objects', () => {
    const obj = getMessageObject('utility.ping');
    expect(obj?.embed?.title).toBe('🏓 Pong!');
    const color = obj?.embed?.color;
    expect(color).toBe('#00d2ff');
  });

  it('reload works and preserves content', () => {
    reloadMessages();
    expect(hasMessage('utility.ping')).toBe(true);
  });
});

describe('message-handler — embed building', () => {
  it('builds a color-matched embed from a schema', () => {
    const embed = createEmbed('utility.ping.embed', { gateway: 42 });
    const color = (embed.data as any).color;
    const fields = (embed.data as any).fields || [];
    expect(color).toBe(0x00d2ff);
    expect((embed.data as any).title).toBe('🏓 Pong!');
    expect(fields[0]?.value).toBe('`42ms`');
  });

  it('falls back to a plain description embed', () => {
    const embed = createEmbed('missing.thing', {}, '>');
    expect((embed.data as any).description).toBe('missing.thing');
    expect((embed.data as any).color).toBe(0x00d2ff);
  });

  it('formats named color aliases', () => {
    const embed = formatSuccess('Done', 'Finished');
    expect((embed.data as any).color).toBe(0x00e676);
  });

  it('formatError prefers a known message key over raw text', () => {
    const embed = formatError('invalid_user', { user: 'ghost' }, '>');
    expect((embed.data as any).title).toBe('❌ Error');
    expect((embed.data as any).color).toBe(0xff1744);
  });

  it('formatError falls back to interpolating the literal text', () => {
    const embed = formatError('custom failure for {target}', { target: 'x' }, '>');
    expect((embed.data as any).description).toBe('custom failure for x');
  });

  it('formatSuccess interpolates both title and description', () => {
    const embed = formatSuccess('Welcome {name}', 'You are {role}', { name: 'Jane', role: 'admin' });
    expect((embed.data as any).title).toBe('Welcome Jane');
    expect((embed.data as any).description).toBe('You are admin');
  });
});