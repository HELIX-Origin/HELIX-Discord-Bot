/**
 * tests/unit/db/feeds-repository.test.ts
 *
 * Unit tests for FeedRepository category caps (F-A), lastPostedAt defaults,
 * and setFeedPosted cadence tracking (F-B), running against a real in-memory
 * SQLite database + AppState.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '../../../src/db/database.js';
import { AppState } from '../../../src/state/app-state.js';
import { FeedRepository } from '../../../src/db/repositories/feeds.js';

let db: Database;
let state: AppState;
let repo: FeedRepository;
let userId: number;

beforeEach(() => {
  db = Database.open(':memory:');
  const result = db.raw
    .prepare("INSERT INTO users (email, password_hash, display_name, role, created_at) VALUES (?, ?, ?, 'member', ?)")
    .run('caps@helix.local', 'x', 'Caps Tester', new Date().toISOString());
  userId = Number(result.lastInsertRowid);
  state = new AppState(db);
  repo = new FeedRepository(db, state);
});

function rssUrl(n: number): string {
  return `https://news.example.com/rss-${n}.xml`;
}

describe('FeedRepository category caps (F-A)', () => {
  it('allows up to 5 News & RSS category feeds (rss/scrape)', () => {
    for (let i = 1; i <= 5; i += 1) {
      expect(repo.addFeed(userId, `RSS ${i}`, rssUrl(i), 'ch-1', 'rss', null).id).toBe(i);
    }
    expect(repo.listFeeds(userId)).toHaveLength(5);
    expect(() => repo.addFeed(userId, 'RSS 6', rssUrl(6), 'ch-1', 'rss', null)).toThrow(
      'Subscription limit reached: at most 5 News & RSS feed(s) allowed.',
    );
  });

  it('allows up to 5 Reddit feeds', () => {
    for (let i = 1; i <= 5; i += 1) {
      expect(repo.addFeed(userId, `r/sub${i}`, `https://www.reddit.com/r/sub${i}/.rss`, 'ch-1', 'reddit', null).id).toBe(
        i,
      );
    }
    expect(() =>
      repo.addFeed(userId, 'r/sixth', 'https://www.reddit.com/r/sixth/.rss', 'ch-1', 'reddit', null),
    ).toThrow('Subscription limit reached: at most 5 Reddit feed(s) allowed.');
  });

  it('enforces caps per category independently and leaves unlisted categories unlimited', () => {
    for (let i = 1; i <= 5; i += 1) {
      repo.addFeed(userId, `RSS ${i}`, rssUrl(i), 'ch-1', 'rss', null);
    }
    for (let i = 1; i <= 5; i += 1) {
      repo.addFeed(userId, `r/sub${i}`, `https://www.reddit.com/r/sub${i}/.rss`, 'ch-2', 'reddit', null);
    }

    for (let i = 1; i <= 7; i += 1) {
      repo.addFeed(userId, `Free ${i}`, `https://free.example.com/${i}`, 'ch-3', 'free_games', null);
    }
    repo.addFeed(userId, 'YT', 'https://youtube.example.com/yt', 'ch-4', 'youtube', null);
    repo.addFeed(userId, 'TTV', 'https://twitch.example.com/ttv', 'ch-4', 'twitch', null);

    expect(repo.listFeeds(userId)).toHaveLength(5 + 5 + 7 + 2);
  });

  it('counts scrape feeds toward the News & RSS cap', () => {
    for (let i = 1; i <= 4; i += 1) {
      repo.addFeed(userId, `RSS ${i}`, rssUrl(i), 'ch-1', 'rss', null);
    }
    repo.addFeed(
      userId,
      'Scrape 1',
      'https://scrape.example.com/1',
      'ch-1',
      'scrape',
      { item: 'article', title: 'h2', link: 'a' },
    );
    expect(() =>
      repo.addFeed(userId, 'RSS 6', rssUrl(6), 'ch-1', 'rss', null),
    ).toThrow('Subscription limit reached: at most 5 News & RSS feed(s) allowed.');
  });
});

describe('FeedRepository lastPostedAt (F-B)', () => {
  it('defaults lastPostedAt to null on newly added feeds', () => {
    const feed = repo.addFeed(userId, 'Caps', 'https://cap.example.com/feed.xml', 'ch-1', 'rss', null);
    expect(feed.lastPostedAt).toBeNull();
  });

  it('setFeedPosted stamps the feed state and persists to SQLite', () => {
    const feed = repo.addFeed(userId, 'Caps', 'https://cap.example.com/feed.xml', 'ch-1', 'rss', null);
    expect(feed.lastPostedAt).toBeNull();

    repo.setFeedPosted(userId, feed.id);
    const updated = repo.getFeed(userId, feed.id)!;
    expect(updated.lastPostedAt).not.toBeNull();
    expect(Number.isNaN(new Date(updated.lastPostedAt!).getTime())).toBe(false);

    // Persisted: a freshly hydrated AppState mirror sees the column value.
    const hydrated = new AppState(db);
    const refetched = hydrated.getFeed(userId, feed.id)!;
    expect(new Date(refetched.lastPostedAt!).getTime()).toBe(new Date(updated.lastPostedAt!).getTime());
  });
});