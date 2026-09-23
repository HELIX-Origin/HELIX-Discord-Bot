/**
 * tests/unit/feed/watcher.test.ts
 *
 * Unit tests for FeedWatcher real-time single-newest-post delivery,
 * elimination of artificial 6-hour/daily floors, and backlog draining.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Database } from '../../../src/db/database.js';
import { Repository } from '../../../src/db/repository.js';
import { FeedWatcher } from '../../../src/feed/watcher.js';
import * as fetchModule from '../../../src/feed/fetch.js';
import * as freeGamesModule from '../../../src/feed/freegames.js';

let db: Database;
let repo: Repository;
let userId: number;
let sentMessages: Array<{ channelId: string; payload: { content?: string; embeds?: unknown[] } }>;
let botMock: {
  sendChannelMessage: (channelId: string, payload: { content?: string; embeds?: unknown[] }) => Promise<void>;
  getAppIconUrl: () => string;
};

beforeEach(() => {
  db = Database.open(':memory:');
  const userRow = db.raw
    .prepare("INSERT INTO users (email, password_hash, display_name, role, created_at) VALUES (?, ?, ?, 'member', ?)")
    .run('watcher@helix.local', 'x', 'Watcher Tester', new Date().toISOString());
  userId = Number(userRow.lastInsertRowid);
  repo = new Repository(db);

  sentMessages = [];
  botMock = {
    sendChannelMessage: async (channelId, payload) => {
      sentMessages.push({ channelId, payload });
    },
    getAppIconUrl: () => 'https://cdn.example.com/icon.png',
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

const sampleRssXml = (
  items: Array<{ title: string; link: string; guid: string; pubDate: string }>,
) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tech News</title>
    <link>https://technews.example.com</link>
    <description>Latest tech news</description>
    ${items
      .map(
        (item) => `
    <item>
      <title>${item.title}</title>
      <link>${item.link}</link>
      <guid>${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
    </item>`,
      )
      .join('\n')}
  </channel>
</rss>`;

describe('FeedWatcher Real-Time Single-Newest-Post Delivery', () => {
  it('delivers strictly the single newest post and drains older backlog entries', async () => {
    const feed = repo.addFeed(userId, 'Tech Feed', 'https://technews.example.com/feed.xml', 'ch-news', 'rss', null);

    const items = [
      {
        title: 'Newest Article',
        link: 'https://technews.example.com/3',
        guid: 'guid-3',
        pubDate: 'Wed, 23 Sep 2026 12:00:00 GMT',
      },
      {
        title: 'Middle Article',
        link: 'https://technews.example.com/2',
        guid: 'guid-2',
        pubDate: 'Wed, 23 Sep 2026 11:00:00 GMT',
      },
      {
        title: 'Oldest Article',
        link: 'https://technews.example.com/1',
        guid: 'guid-1',
        pubDate: 'Wed, 23 Sep 2026 10:00:00 GMT',
      },
    ];

    vi.spyOn(fetchModule, 'fetchRaw').mockResolvedValue({
      url: feed.url,
      status: 200,
      contentType: 'application/rss+xml',
      body: new Uint8Array(),
      text: sampleRssXml(items),
      durationMs: 15,
      challenged: false,
    });

    const watcher = new FeedWatcher(repo, null, 'error', botMock);
    await watcher.pollFeed(userId, feed.id, true);

    // Only 1 message was sent to Discord
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].channelId).toBe('ch-news');
    const embed = sentMessages[0].payload.embeds?.[0] as { title?: string };
    expect(embed?.title).toBe('Newest Article');

    // The newest entry was marked sent
    expect(repo.isEntrySent(feed.id, 'guid-3')).toBe(true);

    // Older entries from the backlog were also marked sent (drained) to prevent delayed burst dumps
    expect(repo.isEntrySent(feed.id, 'guid-2')).toBe(true);
    expect(repo.isEntrySent(feed.id, 'guid-1')).toBe(true);

    // Feed posted status was updated
    const updatedFeed = repo.getFeed(userId, feed.id);
    expect(updatedFeed?.lastPostedAt).toBeTruthy();
    expect(updatedFeed?.lastEntryId).toBe('guid-3');

    // Next poll with identical items results in no new message sent
    sentMessages.length = 0;
    await watcher.pollFeed(userId, feed.id, true);
    expect(sentMessages).toHaveLength(0);
  });

  it('delivers newly arrived post immediately without being blocked by 6-hour or daily floors', async () => {
    const feed = repo.addFeed(userId, 'Tech Feed', 'https://technews.example.com/feed.xml', 'ch-news', 'rss', null);

    // First poll with an item
    const firstItems = [
      {
        title: 'Article 1',
        link: 'https://technews.example.com/1',
        guid: 'guid-1',
        pubDate: 'Wed, 23 Sep 2026 10:00:00 GMT',
      },
    ];
    const fetchSpy = vi.spyOn(fetchModule, 'fetchRaw').mockResolvedValue({
      url: feed.url,
      status: 200,
      contentType: 'application/rss+xml',
      body: new Uint8Array(),
      text: sampleRssXml(firstItems),
      durationMs: 10,
      challenged: false,
    });

    const watcher = new FeedWatcher(repo, null, 'error', botMock);
    await watcher.pollFeed(userId, feed.id, true);
    expect(sentMessages).toHaveLength(1);

    // A brand new post arrives shortly afterwards (e.g. minutes later on the same day)
    const secondItems = [
      {
        title: 'Breaking News Just In',
        link: 'https://technews.example.com/2',
        guid: 'guid-2',
        pubDate: 'Wed, 23 Sep 2026 10:05:00 GMT',
      },
      {
        title: 'Article 1',
        link: 'https://technews.example.com/1',
        guid: 'guid-1',
        pubDate: 'Wed, 23 Sep 2026 10:00:00 GMT',
      },
    ];
    fetchSpy.mockResolvedValue({
      url: feed.url,
      status: 200,
      contentType: 'application/rss+xml',
      body: new Uint8Array(),
      text: sampleRssXml(secondItems),
      durationMs: 10,
      challenged: false,
    });

    sentMessages.length = 0;
    await watcher.pollFeed(userId, feed.id, true);

    // Breaking news is delivered immediately without being blocked by artificial 6-hour or UTC-day throttle!
    expect(sentMessages).toHaveLength(1);
    const embed = sentMessages[0].payload.embeds?.[0] as { title?: string };
    expect(embed?.title).toBe('Breaking News Just In');
    expect(repo.isEntrySent(feed.id, 'guid-2')).toBe(true);
  });

  it('delivers only the single newest free game and marks older games as sent to prevent burst spam', async () => {
    const feed = repo.addFeed(userId, 'Free Games Epic', 'https://epicgames.com', 'ch-free', 'free_games_epic', null);

    const mockGames: freeGamesModule.FreeGameItem[] = [
      {
        id: 'epic-game-1',
        title: 'Featured Game 1',
        url: 'https://epicgames.com/game1',
        description: 'Free today',
        imageUrl: 'https://cdn.example.com/game1.jpg',
        thumbnailUrl: null,
        worth: '$19.99',
        platform: 'Epic Games Store',
        platformKey: 'epic',
        endDate: null,
        publishedAt: '2026-09-23T12:00:00.000Z',
      },
      {
        id: 'epic-game-2',
        title: 'Secondary Game 2',
        url: 'https://epicgames.com/game2',
        description: 'Also free',
        imageUrl: 'https://cdn.example.com/game2.jpg',
        thumbnailUrl: null,
        worth: '$9.99',
        platform: 'Epic Games Store',
        platformKey: 'epic',
        endDate: null,
        publishedAt: '2026-09-23T11:00:00.000Z',
      },
      {
        id: 'epic-game-3',
        title: 'Tertiary Game 3',
        url: 'https://epicgames.com/game3',
        description: 'Also free',
        imageUrl: 'https://cdn.example.com/game3.jpg',
        thumbnailUrl: null,
        worth: '$4.99',
        platform: 'Epic Games Store',
        platformKey: 'epic',
        endDate: null,
        publishedAt: '2026-09-23T10:00:00.000Z',
      },
    ];

    vi.spyOn(freeGamesModule, 'fetchFreeGames').mockResolvedValue(mockGames);

    const watcher = new FeedWatcher(repo, null, 'error', botMock);
    await watcher.pollFeed(userId, feed.id, true);

    // Only 1 message was delivered to Discord
    expect(sentMessages).toHaveLength(1);
    const embed = sentMessages[0].payload.embeds?.[0] as { title?: string };
    expect(embed?.title).toBe('Featured Game 1');

    // All games are marked as sent so future polls don't burst 10-20 games
    expect(repo.isEntrySent(feed.id, 'epic-game-1')).toBe(true);
    expect(repo.isEntrySent(feed.id, 'epic-game-2')).toBe(true);
    expect(repo.isEntrySent(feed.id, 'epic-game-3')).toBe(true);
  });
});
