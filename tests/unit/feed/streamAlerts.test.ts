/**
 * tests/unit/feed/streamAlerts.test.ts
 *
 * Unit tests for stream alerts (YouTube and Twitch).
 * Covers channel ID / XML URL resolution, Atom XML parsing,
 * Twitch Helix stream metadata, and rich Discord embed formatting.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveYouTubeChannelId,
  resolveYouTubeXmlUrl,
  parseYouTubeAtomXml,
  type YouTubeVideoEntry,
} from '../../../src/feed/youtube.js';
import * as fetchModule from '../../../src/feed/fetch.js';
import { streamAlertEmbed } from '../../../src/bot/utils/embeds.js';
import { Database } from '../../../src/db/database.js';
import { Repository } from '../../../src/db/repository.js';
import { FeedWatcher } from '../../../src/feed/watcher.js';

describe('YouTube stream alerts & feed helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveYouTubeChannelId & resolveYouTubeXmlUrl', () => {
    it('returns bare 24-character UC channel IDs directly', async () => {
      const channelId = 'UC1234567890123456789012';
      expect(await resolveYouTubeChannelId(channelId)).toBe(channelId);
      expect(await resolveYouTubeXmlUrl(channelId)).toBe(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      );
    });

    it('extracts channel ID from XML feed URL', async () => {
      const xmlUrl =
        'https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw';
      expect(await resolveYouTubeChannelId(xmlUrl)).toBe('UC_x5XG1OV2P6uZZ5FSM9Ttw');
      expect(await resolveYouTubeXmlUrl(xmlUrl)).toBe(xmlUrl);
    });

    it('extracts channel ID from standard /channel/ URL', async () => {
      const channelUrl = 'https://www.youtube.com/channel/UCBR8-60-4426UGTr_VDV44A';
      expect(await resolveYouTubeChannelId(channelUrl)).toBe('UCBR8-60-4426UGTr_VDV44A');
      expect(await resolveYouTubeXmlUrl(channelUrl)).toBe(
        'https://www.youtube.com/feeds/videos.xml?channel_id=UCBR8-60-4426UGTr_VDV44A',
      );
    });

    it('resolves handle by scraping channel page HTML', async () => {
      const fetchSpy = vi.spyOn(fetchModule, 'fetchRaw').mockResolvedValue({
        url: 'https://www.youtube.com/@testcreator',
        status: 200,
        text: '<meta itemprop="channelId" content="UCuAXFkgsw1L7xaCfnd5JJOw">',
        body: new Uint8Array(),
        contentType: 'text/html',
        challenged: false,
        durationMs: 15,
      });

      const handle = '@testcreator';
      const resolved = await resolveYouTubeChannelId(handle);
      expect(resolved).toBe('UCuAXFkgsw1L7xaCfnd5JJOw');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://www.youtube.com/@testcreator',
        expect.objectContaining({ timeoutMs: 10_000 }),
      );

      // Verify cached resolution on subsequent call
      const cached = await resolveYouTubeChannelId(handle);
      expect(cached).toBe('UCuAXFkgsw1L7xaCfnd5JJOw');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('parseYouTubeAtomXml', () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <link rel="self" href="http://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890123456789012"/>
  <id>yt:channel:UC1234567890123456789012</id>
  <title>Creator Channel</title>
  <author>
    <name>Creator Channel</name>
    <uri>https://www.youtube.com/channel/UC1234567890123456789012</uri>
  </author>
  <published>2025-01-01T00:00:00+00:00</published>
  <entry>
    <id>yt:video:dQw4w9WgXcQ</id>
    <yt:videoId>dQw4w9WgXcQ</yt:videoId>
    <yt:channelId>UC1234567890123456789012</yt:channelId>
    <title>Awesome New Video</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"/>
    <author>
      <name>Creator Channel</name>
    </author>
    <published>2025-01-15T18:00:00+00:00</published>
    <updated>2025-01-15T18:05:00+00:00</updated>
    <media:group>
      <media:title>Awesome New Video</media:title>
      <media:description>This is the full video description with details.</media:description>
      <media:thumbnail url="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" width="480" height="360"/>
    </media:group>
  </entry>
</feed>`;

    it('correctly parses video entries, strip yt:video prefix, and captures thumbnail', () => {
      const entries: YouTubeVideoEntry[] = parseYouTubeAtomXml(sampleXml);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.id).toBe('dQw4w9WgXcQ');
      expect(entry.title).toBe('Awesome New Video');
      expect(entry.link).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(entry.description).toBe('This is the full video description with details.');
      expect(entry.imageUrl).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });

    it('generates canonical fallback thumbnail if media:thumbnail is absent', () => {
      const xmlWithoutThumb = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Creator Channel</title>
  <entry>
    <id>yt:video:abc123xyz78</id>
    <title>Video Without Thumbnail Tag</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abc123xyz78"/>
    <published>2025-01-15T18:00:00+00:00</published>
  </entry>
</feed>`;
      const entries = parseYouTubeAtomXml(xmlWithoutThumb);
      expect(entries[0].imageUrl).toBe('https://i.ytimg.com/vi/abc123xyz78/hqdefault.jpg');
    });
  });
});

describe('streamAlertEmbed presentation', () => {
  it('formats YouTube video upload embed with red color and upload type field', () => {
    const embed = streamAlertEmbed({
      title: 'New Gameplay Episode',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'Check out the new episode!',
      author: 'GamerChannel',
      publishedAt: '2025-01-15T18:00:00.000Z',
      feedTitle: 'GamerChannel YouTube',
      feedType: 'youtube',
      imageUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });

    expect(embed.color).toBe(0xff0000);
    expect(embed.title).toBe('New Gameplay Episode');
    expect(embed.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(embed.image?.url).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(embed.fields).toContainEqual(
      expect.objectContaining({ name: '▶️ Type', value: 'Video Upload' }),
    );
  });

  it('formats Twitch live stream embed with purple color, Category, and formatted Viewers', () => {
    const embed = streamAlertEmbed({
      title: 'Grand Finals Watch Party!',
      url: 'https://twitch.tv/proplayer',
      description: 'Watch the exciting grand finals live!',
      author: 'ProPlayer',
      publishedAt: '2025-01-15T20:00:00.000Z',
      feedTitle: 'ProPlayer Twitch',
      feedType: 'twitch',
      game: 'Street Fighter 6',
      viewers: 14250,
      imageUrl: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_proplayer-1280x720.jpg',
    });

    expect(embed.color).toBe(0x9146ff);
    expect(embed.title).toBe('Grand Finals Watch Party!');
    expect(embed.fields).toContainEqual(
      expect.objectContaining({ name: '🎮 Category', value: 'Street Fighter 6' }),
    );
    expect(embed.fields).toContainEqual(
      expect.objectContaining({ name: '👥 Viewers', value: '14,250 viewers' }),
    );
    expect(embed.image?.url).toBe(
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_proplayer-1280x720.jpg',
    );
  });
});

describe('FeedWatcher Stream Alert Fetching', () => {
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
      .run('stream@helix.local', 'x', 'Stream Tester', new Date().toISOString());
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

  it('fetches YouTube channel via public Atom XML feed without API keys', async () => {
    const watcher = new FeedWatcher(repo, botMock as never);

    const channelId = 'UC1234567890123456789012';
    const xmlUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <title>YouTube Channel</title>
  <entry>
    <id>yt:video:vid12345</id>
    <title>Public Atom Video</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=vid12345"/>
    <published>2025-01-20T10:00:00+00:00</published>
    <media:group>
      <media:title>Public Atom Video</media:title>
      <media:description>Public video description</media:description>
      <media:thumbnail url="https://i.ytimg.com/vi/vid12345/hqdefault.jpg"/>
    </media:group>
  </entry>
</feed>`;

    vi.spyOn(fetchModule, 'fetchRaw').mockResolvedValue({
      url: xmlUrl,
      status: 200,
      text: sampleXml,
      body: new TextEncoder().encode(sampleXml),
      contentType: 'application/atom+xml',
      challenged: false,
      durationMs: 20,
    });

    const entries = await (watcher as unknown as { fetchYouTubeFeed: (feed: unknown) => Promise<unknown[]> }).fetchYouTubeFeed({
      id: 1,
      name: 'YouTube Channel',
      url: xmlUrl,
      type: 'youtube',
    });

    expect(entries).toHaveLength(1);
    const first = entries[0] as { id: string; title: string; link: string; imageUrl: string };
    expect(first.id).toBe('vid12345');
    expect(first.title).toBe('Public Atom Video');
    expect(first.link).toBe('https://www.youtube.com/watch?v=vid12345');
    expect(first.imageUrl).toBe('https://i.ytimg.com/vi/vid12345/hqdefault.jpg');
  });

  it('fetches Twitch live streams and extracts category and viewer count', async () => {
    const watcher = new FeedWatcher(repo, botMock as never);

    // Set Twitch environment variables
    const originalClientId = process.env['TWITCH_CLIENT_ID'];
    const originalClientSecret = process.env['TWITCH_CLIENT_SECRET'];
    process.env['TWITCH_CLIENT_ID'] = 'test-client-id';
    process.env['TWITCH_CLIENT_SECRET'] = 'test-client-secret';

    const globalFetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: unknown) => {
      const url = String(input);
      if (url.includes('id.twitch.tv/oauth2/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'mock-app-token',
            expires_in: 3600,
            token_type: 'bearer',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (url.includes('api.twitch.tv/helix/streams')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'stream-98765',
                user_login: 'streamerpro',
                user_name: 'StreamerPro',
                game_name: 'Elden Ring',
                title: 'No Hit Run Attempt #4',
                viewer_count: 5420,
                started_at: '2025-01-20T12:00:00Z',
                thumbnail_url: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_streamerpro-{width}x{height}.jpg',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response('Not Found', { status: 404 });
    });

    try {
      const entries = await (watcher as unknown as { fetchTwitchFeed: (feed: unknown) => Promise<unknown[]> }).fetchTwitchFeed({
        id: 2,
        name: 'StreamerPro Twitch',
        url: 'https://twitch.tv/streamerpro',
        type: 'twitch',
      });

      expect(entries).toHaveLength(1);
      const stream = entries[0] as {
        id: string;
        title: string;
        link: string;
        game: string;
        viewers: number;
        imageUrl: string;
      };
      expect(stream.id).toBe('stream-98765');
      expect(stream.title).toBe('StreamerPro is live: No Hit Run Attempt #4');
      expect(stream.link).toBe('https://twitch.tv/streamerpro');
      expect(stream.game).toBe('Elden Ring');
      expect(stream.viewers).toBe(5420);
      expect(stream.imageUrl).toBe(
        'https://static-cdn.jtvnw.net/previews-ttv/live_user_streamerpro-1280x720.jpg',
      );
    } finally {
      if (originalClientId) process.env['TWITCH_CLIENT_ID'] = originalClientId;
      else delete process.env['TWITCH_CLIENT_ID'];

      if (originalClientSecret) process.env['TWITCH_CLIENT_SECRET'] = originalClientSecret;
      else delete process.env['TWITCH_CLIENT_SECRET'];

      globalFetchSpy.mockRestore();
    }
  });
});
