/**
 * tests/unit/embeds/limits.test.ts
 *
 * Unit tests for clampText() and the limit constant tables.
 * These are pure functions with zero external dependencies.
 */
import { describe, it, expect } from 'vitest';
import { clampText, EMBED_LIMITS, TEXT_LIMITS } from '../../../src/bot/lib/embeds/limits.js';

describe('clampText', () => {
  it('returns the original string when within limit', () => {
    expect(clampText('Hello world', 50)).toBe('Hello world');
  });

  it('trims leading/trailing whitespace', () => {
    expect(clampText('  hello  ', 100)).toBe('hello');
  });

  it('collapses 3+ consecutive newlines to 2', () => {
    expect(clampText('a\n\n\n\nb', 100)).toBe('a\n\nb');
  });

  it('strips trailing whitespace before newlines', () => {
    expect(clampText('line1   \nline2', 100)).toBe('line1\nline2');
  });

  it('appends an ellipsis when text exceeds max', () => {
    const result = clampText('a'.repeat(200), 100);
    expect(result.endsWith('…')).toBe(true);
  });

  it('never returns a string longer than max + 1 (ellipsis char)', () => {
    const result = clampText('word '.repeat(50), 80);
    expect(result.length).toBeLessThanOrEqual(81);
  });

  it('prefers cutting at a word boundary when possible', () => {
    // "The quick brown fox" — cut at 15 should not split "brown"
    const result = clampText('The quick brown fox jumps', 15);
    expect(result).not.toMatch(/q…$/); // should not end mid-word
  });

  it('handles empty string without error', () => {
    expect(clampText('', 50)).toBe('');
  });

  it('handles a string that is exactly at the limit', () => {
    const str = 'x'.repeat(50);
    expect(clampText(str, 50)).toBe(str);
  });
});

describe('EMBED_LIMITS and TEXT_LIMITS', () => {
  it('TEXT_LIMITS.title is within EMBED_LIMITS.title', () => {
    expect(TEXT_LIMITS.title).toBeLessThanOrEqual(EMBED_LIMITS.title);
  });

  it('TEXT_LIMITS.description is within EMBED_LIMITS.description', () => {
    expect(TEXT_LIMITS.description).toBeLessThanOrEqual(EMBED_LIMITS.description);
  });

  it('TEXT_LIMITS.fieldName is within EMBED_LIMITS.fieldName', () => {
    expect(TEXT_LIMITS.fieldName).toBeLessThanOrEqual(EMBED_LIMITS.fieldName);
  });

  it('TEXT_LIMITS.fieldValue is within EMBED_LIMITS.fieldValue', () => {
    expect(TEXT_LIMITS.fieldValue).toBeLessThanOrEqual(EMBED_LIMITS.fieldValue);
  });

  it('EMBED_LIMITS.fields === 25 (Discord API maximum)', () => {
    expect(EMBED_LIMITS.fields).toBe(25);
  });
});
