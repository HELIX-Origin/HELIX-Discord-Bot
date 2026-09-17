/**
 * tests/unit/utils/format.test.ts
 *
 * Unit tests for formatting utility functions in src/bot/utils/embeds.ts:
 *   - formatDuration()
 *   - formatNumber()
 *   - formatReadableUrlLabel()
 *   - cleanTitle()
 */
import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatNumber,
  formatReadableUrlLabel,
  cleanTitle,
} from '../../../src/bot/utils/embeds.js';

// ── formatDuration() ──────────────────────────────────────────────────────────

describe('formatDuration()', () => {
  it('formats sub-second durations in ms', () => {
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(1)).toBe('1ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats durations under 1 minute in seconds', () => {
    expect(formatDuration(1_000)).toBe('1s');
    expect(formatDuration(30_000)).toBe('30s');
    expect(formatDuration(59_000)).toBe('59s');
  });

  it('formats durations of exactly 1 minute', () => {
    expect(formatDuration(60_000)).toBe('1m 0s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90_000)).toBe('1m 30s');
    expect(formatDuration(3_599_000)).toBe('59m 59s');
  });

  it('formats exactly 1 hour', () => {
    expect(formatDuration(3_600_000)).toBe('1h 0m');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3_661_000)).toBe('1h 1m');
    expect(formatDuration(7_200_000)).toBe('2h 0m');
    expect(formatDuration(9_000_000)).toBe('2h 30m');
  });
});

// ── formatNumber() ────────────────────────────────────────────────────────────

describe('formatNumber()', () => {
  it('returns raw number below 1,000', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats exactly 1,000 as "1.0K"', () => {
    expect(formatNumber(1_000)).toBe('1.0K');
  });

  it('formats thousands with one decimal', () => {
    expect(formatNumber(1_500)).toBe('1.5K');
    expect(formatNumber(10_000)).toBe('10.0K');
    expect(formatNumber(999_999)).toBe('1000.0K');
  });

  it('formats exactly 1,000,000 as "1.0M"', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M');
  });

  it('formats millions with one decimal', () => {
    expect(formatNumber(1_500_000)).toBe('1.5M');
    expect(formatNumber(2_750_000)).toBe('2.8M');
  });
});

// ── formatReadableUrlLabel() ──────────────────────────────────────────────────

describe('formatReadableUrlLabel()', () => {
  it('returns just the hostname for a root URL', () => {
    expect(formatReadableUrlLabel('https://example.com/')).toBe('example.com');
    expect(formatReadableUrlLabel('https://example.com')).toBe('example.com');
  });

  it('strips the www. prefix', () => {
    expect(formatReadableUrlLabel('https://www.example.com/path')).toBe('example.com/path');
  });

  it('includes the path for a deep URL', () => {
    const result = formatReadableUrlLabel('https://news.example.com/tech/article');
    expect(result).toContain('news.example.com');
    expect(result).toContain('/tech/article');
  });

  it('collapses long paths to hostname/.../last-segment', () => {
    const url = 'https://example.com/a/b/c/d/e/f';
    const result = formatReadableUrlLabel(url);
    expect(result).toContain('...');
  });

  it('truncates to 36 characters with "..."', () => {
    const url = 'https://very-long-hostname.example.com/very/long/path/segment';
    const result = formatReadableUrlLabel(url);
    expect(result.length).toBeLessThanOrEqual(36);
  });

  it('returns "Link" for an invalid URL', () => {
    expect(formatReadableUrlLabel('not-a-url')).toBe('Link');
    expect(formatReadableUrlLabel('')).toBe('Link');
  });
});

// ── cleanTitle() ──────────────────────────────────────────────────────────────

describe('cleanTitle()', () => {
  it('returns "Untitled" for an empty string', () => {
    expect(cleanTitle('')).toBe('Untitled');
  });

  it('returns "Untitled" for a whitespace-only string', () => {
    expect(cleanTitle('   ')).toBe('Untitled');
  });

  it('strips HTML tags', () => {
    expect(cleanTitle('<b>Bold Title</b>')).toBe('Bold Title');
    expect(cleanTitle('<p>Paragraph <em>with emphasis</em></p>')).toBe('Paragraph with emphasis');
  });

  it('decodes HTML entities', () => {
    expect(cleanTitle('Hello &amp; World')).toBe('Hello & World');
    expect(cleanTitle('It&rsquo;s Alive!')).toBe('It\u2019s Alive!');
  });

  it('collapses multiple whitespace characters into a single space', () => {
    expect(cleanTitle('too    many   spaces')).toBe('too many spaces');
  });

  it('trims leading and trailing whitespace', () => {
    expect(cleanTitle('  trimmed  ')).toBe('trimmed');
  });

  it('truncates to maxLength with "..."', () => {
    const longTitle = 'word '.repeat(50).trim();
    const result = cleanTitle(longTitle, 50);
    // result should be ≤ 50 + "..." length
    expect(result.length).toBeLessThanOrEqual(53);
  });

  it('does not truncate when title fits within maxLength', () => {
    expect(cleanTitle('Short title', 200)).toBe('Short title');
  });

  it('handles titles with mixed HTML and entities', () => {
    const result = cleanTitle('<h1>Top &amp; Trending: <em>Today&rsquo;s News</em></h1>');
    expect(result).toContain('Top & Trending');
    expect(result).toContain("\u2019s News");
    expect(result).not.toContain('<');
  });
});
