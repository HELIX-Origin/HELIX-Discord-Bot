/**
 * tests/helpers/feed.ts
 *
 * XML feed fixture strings, entry factory helpers, and network stubs for feed
 * parser and feed command tests.
 */

import { vi, type MockInstance } from 'vitest';
import type { FeedEntry, ParsedFeed } from '../../src/feed/parser.js';
import * as fetchModule from '../../src/feed/fetch.js';

// ── XML Fixtures ──────────────────────────────────────────────────────────────

export const RSS2_SINGLE_ITEM = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test RSS Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Hello World</title>
      <link>https://example.com/hello-world</link>
      <guid>https://example.com/hello-world</guid>
      <description>A simple test post.</description>
      <pubDate>Wed, 01 Jan 2025 12:00:00 +0000</pubDate>
      <author>Alice</author>
    </item>
  </channel>
</rss>`;

export const RSS2_MULTI_ITEM = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Multi Item Feed</title>
    <link>https://multi.example.com</link>
    <item>
      <title>Post One</title>
      <link>https://multi.example.com/1</link>
      <guid>guid-1</guid>
      <description>First post description.</description>
    </item>
    <item>
      <title>Post Two</title>
      <link>https://multi.example.com/2</link>
      <guid>guid-2</guid>
    </item>
    <item>
      <title>Post Three</title>
      <link>https://multi.example.com/3</link>
      <guid>guid-3</guid>
      <description>Third post description.</description>
      <author>Bob</author>
    </item>
  </channel>
</rss>`;

export const RSS2_WITH_IMAGE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Image Feed</title>
    <link>https://img.example.com</link>
    <item>
      <title>Image Post</title>
      <link>https://img.example.com/post</link>
      <guid>guid-img-1</guid>
      <description>&lt;img src="https://cdn.example.com/photo.jpg" alt="photo" /&gt;</description>
    </item>
  </channel>
</rss>`;

export const ATOM_SINGLE_ENTRY = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Test Feed</title>
  <link href="https://atom.example.com" />
  <entry>
    <id>https://atom.example.com/entry-1</id>
    <title>Atom Entry One</title>
    <link href="https://atom.example.com/entry-1" />
    <summary>Atom entry summary text.</summary>
    <published>2025-06-15T10:30:00Z</published>
    <author><name>Carol</name></author>
  </entry>
</feed>`;

export const ATOM_MULTI_ENTRY = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Multi Atom Feed</title>
  <link href="https://atom.example.com/multi" />
  <entry>
    <id>entry-a</id>
    <title>Entry Alpha</title>
    <link href="https://atom.example.com/alpha" />
    <summary>Alpha summary.</summary>
    <published>2025-01-01T00:00:00Z</published>
    <author><name>Dave</name></author>
  </entry>
  <entry>
    <id>entry-b</id>
    <title>Entry Beta</title>
    <link href="https://atom.example.com/beta" />
    <updated>2025-01-02T00:00:00Z</updated>
  </entry>
</feed>`;

// ── Entry / Feed Factories ────────────────────────────────────────────────────

export function makeEntry(overrides: Partial<FeedEntry> = {}): FeedEntry {
  return {
    id: 'entry-id-001',
    title: 'Test Entry',
    link: 'https://example.com/entry-1',
    description: 'Test description.',
    publishedAt: '2025-01-01T00:00:00Z',
    author: 'Tester',
    imageUrl: null,
    ...overrides,
  };
}

export function makeFeed(overrides: Partial<ParsedFeed> = {}): ParsedFeed {
  return {
    title: 'Test Feed',
    link: 'https://example.com',
    entries: [makeEntry()],
    ...overrides,
  };
}

// ── Network Stubs ─────────────────────────────────────────────────────────────

/** The subset of `FetchResult` a stub needs to describe a canned response. */
export type FetchStubResponse = Partial<Awaited<ReturnType<typeof fetchModule.fetchRaw>>>;

export interface StubbedFetch {
  /** Spy over `fetchRaw`, for per-test assertions or overrides. */
  spy: MockInstance<typeof fetchModule.fetchRaw>;
  /** Every URL `fetchRaw` was called with, in call order. */
  urls: () => string[];
}

/**
 * Replaces `fetchRaw` so tests never make real outbound requests.
 *
 * `respond` receives the requested URL and returns the fields to override,
 * letting a test simulate a scrape (for example resolving a YouTube handle to a
 * channel ID) without touching the network. Unmatched URLs return a 404.
 *
 * @param respond Optional per-URL responder.
 */
export function stubFetchRaw(respond?: (url: string) => FetchStubResponse): StubbedFetch {
  const urls: string[] = [];

  const spy = vi.spyOn(fetchModule, 'fetchRaw').mockImplementation(async (url: string) => {
    urls.push(url);
    return {
      url,
      status: 404,
      contentType: null,
      body: new Uint8Array(),
      text: '',
      durationMs: 0,
      challenged: false,
      ...respond?.(url),
    };
  });

  return { spy, urls: () => [...urls] };
}
