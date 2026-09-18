/**
 * tests/unit/feed/reddit.test.ts
 *
 * Unit tests for the Reddit feed cookie parsing, subreddit normalization, and
 * the NSFW age-restriction enforcement rule (F-C). Network probes are avoided:
 * detection with no cookie file fails closed to 'unverifiable'.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseNetscapeCookies,
  parseJsonCookies,
  subredditFromUrlOrName,
  redditCookiesFilePath,
  redditFeedsAvailable,
  assertRedditTargetAllowed,
  clearRedditCookieCache,
  clearRedditNsfwCache,
} from '../../../src/feed/reddit.js';

const ORIGINAL_COOKIES_FILE = process.env['REDDIT_COOKIES_FILE'];
let tmpDir: string;

beforeEach(() => {
  clearRedditCookieCache();
  clearRedditNsfwCache();
  tmpDir = mkdtempSync(join(tmpdir(), 'helix-reddit-'));
});

afterEach(() => {
  if (ORIGINAL_COOKIES_FILE === undefined) delete process.env['REDDIT_COOKIES_FILE'];
  else process.env['REDDIT_COOKIES_FILE'] = ORIGINAL_COOKIES_FILE;
  clearRedditCookieCache();
  clearRedditNsfwCache();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('parseNetscapeCookies', () => {
  it('parses valid reddit cookie lines into a Cookie header', () => {
    const text = [
      '# Netscape HTTP Cookie File',
      '#HttpOnly_.reddit.com\tTRUE\t/\tFALSE\t0\tsession_tracker\tabc123',
      '.reddit.com\tTRUE\t/\tFALSE\t0\tloid\txyz789',
      'www.reddit.com\tFALSE\t/\tFALSE\t0\ttoken\treddit',
      'other-site.com\tTRUE\t/\tFALSE\t0\tsid\toh-no',
      '',
    ].join('\n');
    const header = parseNetscapeCookies(text);
    expect(header).toContain('session_tracker=abc123');
    expect(header).toContain('loid=xyz789');
    expect(header).toContain('token=reddit');
    expect(header).not.toContain('other-site.com');
    expect(header).not.toContain('sid=');
  });

  it('skips expired cookies unless they are session cookies', () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const future = Math.floor(Date.now() / 1000) + 3600;
    const text = [
      `.reddit.com\tTRUE\t/\tFALSE\t${past}\texpired\tbye`,
      `.reddit.com\tTRUE\t/\tFALSE\t${future}\tfuture\tok`,
      '.reddit.com\tTRUE\t/\tFALSE\t0\tsession\tnow',
    ].join('\n');
    expect(parseNetscapeCookies(text)).toBe('future=ok; session=now');
  });

  it('returns null when no reddit cookies match', () => {
    expect(parseNetscapeCookies('other-site.com\tTRUE\t/\tFALSE\t0\tsid\tx')).toBeNull();
  });
});

describe('parseJsonCookies', () => {
  it('parses a top-level array of cookies', () => {
    const json = JSON.stringify([
      { name: 'loid', value: 'abc', domain: '.reddit.com', hostOnly: false, session: true },
      { name: 'sid', value: 'x', domain: 'other-site.com', hostOnly: false, session: true },
    ]);
    const header = parseJsonCookies(json);
    expect(header).toContain('loid=abc');
    expect(header).not.toContain('sid=');
  });

  it('parses the { cookies: [...] } wrapper and honors time-based expiry', () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const futureMs = Date.now() + 3600_000;
    const json = JSON.stringify({
      cookies: [
        { name: 'expired', value: 'no', domain: '.reddit.com', hostOnly: false, session: false, expirationDate: past },
        { name: 'future', value: 'yes', domain: '.reddit.com', hostOnly: false, session: false, expirationDate: futureMs },
        { name: 'live', value: 'ok', domain: '.reddit.com', hostOnly: false, session: true, expires: past },
      ],
    });
    const header = parseJsonCookies(json);
    expect(header).toContain('future=yes');
    expect(header).toContain('live=ok');
    expect(header).not.toContain('expired=');
  });

  it('returns null for invalid JSON or non-cookie payloads', () => {
    expect(parseJsonCookies('not json')).toBeNull();
    expect(parseJsonCookies('{"kind":"other"}')).toBeNull();
  });
});

describe('subredditFromUrlOrName', () => {
  it('extracts bare subreddit slugs from names and URLs', () => {
    expect(subredditFromUrlOrName('memes')).toBe('memes');
    expect(subredditFromUrlOrName('r/memes')).toBe('memes');
    expect(subredditFromUrlOrName('https://reddit.com/r/memes')).toBe('memes');
    expect(subredditFromUrlOrName('https://www.reddit.com/r/memes/')).toBe('memes');
    expect(subredditFromUrlOrName('http://old.reddit.com/r/AskReddit/comments/abc/')).toBe('AskReddit');
    expect(subredditFromUrlOrName('/r/wallpapers')).toBe('wallpapers');
    expect(subredditFromUrlOrName('   ')).toBeNull();
    expect(subredditFromUrlOrName('')).toBeNull();
  });
});

describe('redditCookiesFilePath & redditFeedsAvailable', () => {
  it('prefers REDDIT_COOKIES_FILE when set', () => {
    const target = join(tmpDir, 'session-cookies.json');
    process.env['REDDIT_COOKIES_FILE'] = target;
    expect(redditCookiesFilePath()).toBe(target);
  });

  it('reports unavailable when the configured cookie file does not exist', () => {
    process.env['REDDIT_COOKIES_FILE'] = join(tmpDir, 'missing.json');
    expect(redditFeedsAvailable()).toBe(false);
  });

  it('reports available when the configured cookie file exists', () => {
    const target = join(tmpDir, 'cookies.json');
    writeFileSync(target, '[]');
    process.env['REDDIT_COOKIES_FILE'] = target;
    expect(redditFeedsAvailable()).toBe(true);
    expect(existsSync(target)).toBe(true);
  });
});

describe('assertRedditTargetAllowed (NSFW age-restriction rule)', () => {
  it('returns immediately when the target channel/thread is age-restricted', async () => {
    process.env['REDDIT_COOKIES_FILE'] = join(tmpDir, 'missing.json');
    await expect(assertRedditTargetAllowed('memes', true)).resolves.toBeUndefined();
  });

  it('fails closed for an unverifiable subreddit into a non-age-restricted channel', async () => {
    process.env['REDDIT_COOKIES_FILE'] = join(tmpDir, 'missing.json');
    await expect(assertRedditTargetAllowed('memes', false)).rejects.toThrow(
      "r/memes's content rating could not be verified",
    );
  });
});