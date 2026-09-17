/**
 * tests/unit/feed/parser.test.ts
 *
 * Unit tests for parseFeed() — RSS 2.0 and Atom parsing.
 * Uses XML fixtures from tests/helpers/feed.ts.
 * No network access required.
 */
import { describe, it, expect } from 'vitest';
import { parseFeed, withGuid } from '../../../src/feed/parser.js';
import {
  RSS2_SINGLE_ITEM,
  RSS2_MULTI_ITEM,
  RSS2_WITH_IMAGE,
  ATOM_SINGLE_ENTRY,
  ATOM_MULTI_ENTRY,
  makeEntry,
  makeFeed,
} from '../../helpers/feed.js';

// ── RSS 2.0 — single item ─────────────────────────────────────────────────────

describe('parseFeed() — RSS 2.0 single item', () => {
  const feed = parseFeed(RSS2_SINGLE_ITEM);

  it('parses the feed title', () => {
    expect(feed.title).toBe('Test RSS Feed');
  });

  it('parses the feed link', () => {
    expect(feed.link).toBe('https://example.com');
  });

  it('finds exactly one entry', () => {
    expect(feed.entries).toHaveLength(1);
  });

  it('parses entry title', () => {
    expect(feed.entries[0].title).toBe('Hello World');
  });

  it('parses entry link', () => {
    expect(feed.entries[0].link).toBe('https://example.com/hello-world');
  });

  it('parses entry guid into id', () => {
    expect(feed.entries[0].id).toBe('https://example.com/hello-world');
  });

  it('parses entry description', () => {
    expect(feed.entries[0].description).toBe('A simple test post.');
  });

  it('parses entry pubDate into publishedAt', () => {
    expect(feed.entries[0].publishedAt).toBe('Wed, 01 Jan 2025 12:00:00 +0000');
  });

  it('parses entry author', () => {
    expect(feed.entries[0].author).toBe('Alice');
  });
});

// ── RSS 2.0 — multiple items ──────────────────────────────────────────────────

describe('parseFeed() — RSS 2.0 multiple items', () => {
  const feed = parseFeed(RSS2_MULTI_ITEM);

  it('parses all three entries', () => {
    expect(feed.entries).toHaveLength(3);
  });

  it('preserves entry order', () => {
    expect(feed.entries[0].title).toBe('Post One');
    expect(feed.entries[1].title).toBe('Post Two');
    expect(feed.entries[2].title).toBe('Post Three');
  });

  it('sets null description when <description> is absent', () => {
    // Post Two has no description element
    expect(feed.entries[1].description).toBeNull();
  });

  it('sets null author when <author> is absent', () => {
    expect(feed.entries[0].author).toBeNull();
    expect(feed.entries[1].author).toBeNull();
  });

  it('parses third entry author', () => {
    expect(feed.entries[2].author).toBe('Bob');
  });
});

// ── RSS 2.0 — image extraction from description HTML ─────────────────────────

describe('parseFeed() — RSS 2.0 image in description', () => {
  const feed = parseFeed(RSS2_WITH_IMAGE);

  it('extracts imageUrl from HTML description', () => {
    expect(feed.entries[0].imageUrl).toBe('https://cdn.example.com/photo.jpg');
  });
});

// ── Atom — single entry ───────────────────────────────────────────────────────

describe('parseFeed() — Atom single entry', () => {
  const feed = parseFeed(ATOM_SINGLE_ENTRY);

  it('parses the feed title', () => {
    expect(feed.title).toBe('Atom Test Feed');
  });

  it('parses one entry', () => {
    expect(feed.entries).toHaveLength(1);
  });

  it('parses entry id', () => {
    expect(feed.entries[0].id).toBe('https://atom.example.com/entry-1');
  });

  it('parses entry link from href attribute', () => {
    expect(feed.entries[0].link).toBe('https://atom.example.com/entry-1');
  });

  it('parses summary as description', () => {
    expect(feed.entries[0].description).toBe('Atom entry summary text.');
  });

  it('parses published date into publishedAt', () => {
    expect(feed.entries[0].publishedAt).toBe('2025-06-15T10:30:00Z');
  });

  it('parses author name from nested <name> element', () => {
    expect(feed.entries[0].author).toBe('Carol');
  });
});

// ── Atom — multiple entries ───────────────────────────────────────────────────

describe('parseFeed() — Atom multiple entries', () => {
  const feed = parseFeed(ATOM_MULTI_ENTRY);

  it('parses two entries', () => {
    expect(feed.entries).toHaveLength(2);
  });

  it('parses first entry id', () => {
    expect(feed.entries[0].id).toBe('entry-a');
  });

  it('falls back to <updated> when <published> is absent', () => {
    expect(feed.entries[1].publishedAt).toBe('2025-01-02T00:00:00Z');
  });

  it('sets null author when <author> is absent', () => {
    expect(feed.entries[1].author).toBeNull();
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe('parseFeed() — error handling', () => {
  it('throws on an unsupported root element', () => {
    const xml = '<?xml version="1.0"?><document><item/></document>';
    expect(() => parseFeed(xml)).toThrow(/Unsupported feed root element/);
  });

  it('throws when RSS feed has no <channel>', () => {
    const xml = '<?xml version="1.0"?><rss version="2.0"></rss>';
    expect(() => parseFeed(xml)).toThrow(/no <channel>/);
  });

  it('returns empty entries array for a channel with no items', () => {
    const xml = `<?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <title>Empty Feed</title>
        <link>https://empty.example.com</link>
      </channel>
    </rss>`;
    const feed = parseFeed(xml);
    expect(feed.entries).toHaveLength(0);
  });

  it('returns empty entries array for an Atom feed with no entries', () => {
    const xml = `<?xml version="1.0"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Empty Atom</title>
    </feed>`;
    const feed = parseFeed(xml);
    expect(feed.entries).toHaveLength(0);
  });
});

// ── withGuid() ────────────────────────────────────────────────────────────────

describe('withGuid()', () => {
  it('uses the existing entry.id as guid when present', () => {
    const feed = makeFeed();
    const entry = makeEntry({ id: 'my-unique-id' });
    expect(withGuid(feed, entry).guid).toBe('my-unique-id');
  });

  it('falls back to feed.link + "#" + title when id is empty', () => {
    const feed = makeFeed({ link: 'https://example.com' });
    const entry = makeEntry({ id: '', title: 'My Article' });
    expect(withGuid(feed, entry).guid).toBe('https://example.com#My Article');
  });

  it('spreads all original entry properties into the result', () => {
    const feed = makeFeed();
    const entry = makeEntry();
    const result = withGuid(feed, entry);
    expect(result.id).toBe(entry.id);
    expect(result.title).toBe(entry.title);
    expect(result.link).toBe(entry.link);
  });
});
