/**
 * tests/unit/commands/feeds.test.ts
 *
 * Unit tests for discrete feed commands:
 *   - /rss
 *   - /youtube
 *   - /twitch
 *   - /free-games
 *   - /reddit
 */
import { describe, it, expect } from 'vitest';
import { handleRssCommand, rssCommandDef } from '../../../src/bot/commands/feeds/rss.js';
import { handleYouTubeCommand, youtubeCommandDef } from '../../../src/bot/commands/feeds/youtube.js';
import { handleTwitchCommand, twitchCommandDef } from '../../../src/bot/commands/feeds/twitch.js';
import { handleFreeGamesCommand, freeGamesCommandDef } from '../../../src/bot/commands/feeds/free-games.js';
import { handleRedditCommand, redditCommandDef } from '../../../src/bot/commands/feeds/reddit.js';
import type { AppDeps } from '../../../src/app.js';
import type { DiscordInteraction } from '../../../src/bot/utils/types.js';
import type { Feed } from '../../../src/state/types.js';

function makeDeps(): { deps: AppDeps; feeds: Feed[]; polledIds: number[] } {
  const feeds: Feed[] = [];
  const polledIds: number[] = [];
  let nextId = 1;

  const deps = {
    config: {
      publicBaseUrl: 'https://helix.example.com',
      features: {
        feedsEnabled: true,
        streamalertsEnabled: true,
      },
    },
    bot: {
      getAppName: () => 'HELIX Bot',
      getAppIconUrl: () => 'https://cdn.example.com/icon.png',
    },
    feeds: {
      pollFeed: async (_userId: number, feedId: number, _force?: boolean) => {
        polledIds.push(feedId);
      },
      pollAllFeeds: async (_force?: boolean) => 0,
      pollGuildFeeds: async (_guildId: string, _force?: boolean) => 0,
    },
    repo: {
      getOrCreateGuildUser: (_guildId: string) => ({ id: 101, email: 'guild@helix.local' }),
      addFeed: (
        userId: number,
        name: string,
        url: string,
        channelId: string | null,
        feedType: Feed['feedType'],
        scrape: Feed['scrape'],
        guildId?: string | null,
      ) => {
        const feed: Feed = {
          id: nextId++,
          userId,
          name,
          url,
          topic: null,
          channelId,
          forumChannelId: null,
          guildId: guildId || null,
          enabled: 1,
          feedType,
          scrape,
          lastEntryId: null,
          lastCheckedAt: null,
          createdAt: new Date().toISOString(),
          threadChannelId: null,
          threadEntryCount: 0,
        };
        feeds.push(feed);
        return feed;
      },
      listFeeds: (_userId: number) => [...feeds],
      deleteFeed: (_userId: number, id: number) => {
        const idx = feeds.findIndex((f) => f.id === id);
        if (idx !== -1) feeds.splice(idx, 1);
      },
      updateFeed: (_userId: number, id: number, fields: Partial<Feed>) => {
        const f = feeds.find((item) => item.id === id);
        if (f) Object.assign(f, fields);
        return f || null;
      },
      logActivity: () => {},
    },
  } as unknown as AppDeps;

  return { deps, feeds, polledIds };
}

function makeInteraction(overrides: Partial<DiscordInteraction> = {}): DiscordInteraction {
  return {
    id: 'int-123',
    application_id: 'app-123',
    guild_id: 'guild-123',
    channel_id: 'ch-general',
    type: 2,
    token: 'tok-123',
    version: 1,
    ...overrides,
    data: {
      id: 'cmd-123',
      type: 1,
      name: 'rss',
      ...overrides.data,
    },
  };
}

// ── /rss ──────────────────────────────────────────────────────────────────────

describe('/rss command', () => {
  it('has subcommands: add, list, remove, toggle, poll', () => {
    const subNames = rssCommandDef.options?.map((o) => o.name);
    expect(subNames).toContain('add');
    expect(subNames).toContain('list');
    expect(subNames).toContain('remove');
    expect(subNames).toContain('toggle');
    expect(subNames).toContain('poll');
  });

  it('adds an RSS feed', async () => {
    const { deps, feeds } = makeDeps();
    const interaction = makeInteraction({
      data: {
        id: 'cmd-1',
        type: 1,
        name: 'rss',
        options: [
          {
            name: 'add',
            type: 1,
            options: [
              { name: 'url', type: 3, value: 'https://news.ycombinator.com/rss' },
              { name: 'name', type: 3, value: 'Hacker News' },
            ],
          },
        ],
      },
    });

    const res = await handleRssCommand(interaction, deps, {} as any);
    expect(feeds).toHaveLength(1);
    expect(feeds[0].name).toBe('Hacker News');
    expect(feeds[0].feedType).toBe('rss');
    expect(res.data?.embeds![0].title).toContain('RSS Feed Added');
  });

  it('lists RSS feeds', async () => {
    const { deps } = makeDeps();
    // Add feed first
    await handleRssCommand(
      makeInteraction({
        data: {
          id: 'c1',
          type: 1,
          name: 'rss',
          options: [
            {
              name: 'add',
              type: 1,
              options: [
                { name: 'url', type: 3, value: 'https://example.com/rss' },
                { name: 'name', type: 3, value: 'Example' },
              ],
            },
          ],
        },
      }),
      deps,
      {} as any,
    );

    const listRes = await handleRssCommand(
      makeInteraction({
        data: {
          id: 'c2',
          type: 1,
          name: 'rss',
          options: [{ name: 'list', type: 1 }],
        },
      }),
      deps,
      {} as any,
    );
    expect(listRes.data?.embeds![0].title).toContain('RSS & Scraper Feeds');
    expect(listRes.data?.embeds![0].fields?.length).toBe(1);
  });

  it('polls an RSS feed', async () => {
    const { deps, polledIds } = makeDeps();
    await handleRssCommand(
      makeInteraction({
        data: {
          id: 'c1',
          type: 1,
          name: 'rss',
          options: [
            {
              name: 'add',
              type: 1,
              options: [
                { name: 'url', type: 3, value: 'https://example.com/rss' },
                { name: 'name', type: 3, value: 'Example' },
              ],
            },
          ],
        },
      }),
      deps,
      {} as any,
    );

    const pollRes = await handleRssCommand(
      makeInteraction({
        data: {
          id: 'c2',
          type: 1,
          name: 'rss',
          options: [{ name: 'poll', type: 1, options: [{ name: 'id', type: 3, value: '1' }] }],
        },
      }),
      deps,
      {} as any,
    );
    expect(pollRes.data?.embeds![0].title).toContain('Feed Check Complete');
    expect(polledIds).toContain(1);
  });
});

// ── /youtube ──────────────────────────────────────────────────────────────────

describe('/youtube command', () => {
  it('has subcommands: add, list, remove, toggle, check', () => {
    const subNames = youtubeCommandDef.options?.map((o) => o.name);
    expect(subNames).toContain('add');
    expect(subNames).toContain('list');
    expect(subNames).toContain('remove');
    expect(subNames).toContain('toggle');
    expect(subNames).toContain('check');
  });

  it('adds a YouTube channel feed', async () => {
    const { deps, feeds } = makeDeps();
    const interaction = makeInteraction({
      data: {
        id: 'cmd-yt',
        type: 1,
        name: 'youtube',
        options: [
          {
            name: 'add',
            type: 1,
            options: [
              { name: 'channel_id', type: 3, value: '@veritasium' },
            ],
          },
        ],
      },
    });

    const res = await handleYouTubeCommand(interaction, deps, {} as any);
    expect(feeds).toHaveLength(1);
    expect(feeds[0].feedType).toBe('youtube');
    expect(res.data?.embeds![0].title).toContain('YouTube Alert Added');
  });

  it('checks YouTube channel feeds', async () => {
    const { deps, polledIds } = makeDeps();
    await handleYouTubeCommand(
      makeInteraction({
        data: {
          id: 'cmd-yt-add',
          type: 1,
          name: 'youtube',
          options: [
            {
              name: 'add',
              type: 1,
              options: [
                { name: 'channel_id', type: 3, value: '@veritasium' },
              ],
            },
          ],
        },
      }),
      deps,
      {} as any,
    );

    const checkRes = await handleYouTubeCommand(
      makeInteraction({
        data: {
          id: 'cmd-yt-check',
          type: 1,
          name: 'youtube',
          options: [{ name: 'check', type: 1 }],
        },
      }),
      deps,
      {} as any,
    );
    expect(checkRes.data?.embeds![0].title).toContain('YouTube Check Complete');
    expect(polledIds).toContain(1);
  });
});

// ── /twitch ───────────────────────────────────────────────────────────────────

describe('/twitch command', () => {
  it('has subcommands: add, list, remove, toggle, check', () => {
    const subNames = twitchCommandDef.options?.map((o) => o.name);
    expect(subNames).toContain('add');
    expect(subNames).toContain('list');
    expect(subNames).toContain('remove');
    expect(subNames).toContain('toggle');
    expect(subNames).toContain('check');
  });

  it('adds a Twitch streamer alert', async () => {
    const { deps, feeds } = makeDeps();
    const interaction = makeInteraction({
      data: {
        id: 'cmd-twitch',
        type: 1,
        name: 'twitch',
        options: [
          {
            name: 'add',
            type: 1,
            options: [
              { name: 'streamer', type: 3, value: 'shroud' },
            ],
          },
        ],
      },
    });

    const res = await handleTwitchCommand(interaction, deps, {} as any);
    expect(feeds).toHaveLength(1);
    expect(feeds[0].feedType).toBe('twitch');
    expect(feeds[0].url).toBe('https://twitch.tv/shroud');
    expect(res.data?.embeds![0].title).toContain('Twitch Alert Added');
  });

  it('checks Twitch streamer alerts', async () => {
    const { deps, polledIds } = makeDeps();
    await handleTwitchCommand(
      makeInteraction({
        data: {
          id: 'cmd-tw-add',
          type: 1,
          name: 'twitch',
          options: [
            {
              name: 'add',
              type: 1,
              options: [
                { name: 'streamer', type: 3, value: 'shroud' },
              ],
            },
          ],
        },
      }),
      deps,
      {} as any,
    );

    const checkRes = await handleTwitchCommand(
      makeInteraction({
        data: {
          id: 'cmd-tw-check',
          type: 1,
          name: 'twitch',
          options: [{ name: 'check', type: 1 }],
        },
      }),
      deps,
      {} as any,
    );
    expect(checkRes.data?.embeds![0].title).toContain('Twitch Check Complete');
    expect(polledIds).toContain(1);
  });
});

// ── /free-games ───────────────────────────────────────────────────────────────

describe('/free-games command', () => {
  it('has subcommands: enable, status, disable, check', () => {
    const subNames = freeGamesCommandDef.options?.map((o) => o.name);
    expect(subNames).toContain('enable');
    expect(subNames).toContain('status');
    expect(subNames).toContain('disable');
    expect(subNames).toContain('check');
  });

  it('enables free game alerts and checks status', async () => {
    const { deps, feeds } = makeDeps();
    const enableInteraction = makeInteraction({
      data: {
        id: 'cmd-fg-1',
        type: 1,
        name: 'free-games',
        options: [{ name: 'enable', type: 1 }],
      },
    });

    const enableRes = await handleFreeGamesCommand(enableInteraction, deps, {} as any);
    expect(feeds).toHaveLength(1);
    expect(feeds[0].feedType).toBe('free_games');
    expect(enableRes.data?.embeds![0].title).toContain('Free Games Alerts Enabled');

    const statusInteraction = makeInteraction({
      data: {
        id: 'cmd-fg-2',
        type: 1,
        name: 'free-games',
        options: [{ name: 'status', type: 1 }],
      },
    });

    const statusRes = await handleFreeGamesCommand(statusInteraction, deps, {} as any);
    expect(statusRes.data?.embeds![0].title).toContain('Free Games Alerts Status');
  });

  it('checks free game feeds manually', async () => {
    const { deps, polledIds } = makeDeps();
    await handleFreeGamesCommand(
      makeInteraction({
        data: {
          id: 'cmd-fg-add',
          type: 1,
          name: 'free-games',
          options: [{ name: 'enable', type: 1 }],
        },
      }),
      deps,
      {} as any,
    );

    const checkRes = await handleFreeGamesCommand(
      makeInteraction({
        data: {
          id: 'cmd-fg-chk',
          type: 1,
          name: 'free-games',
          options: [{ name: 'check', type: 1 }],
        },
      }),
      deps,
      {} as any,
    );
    expect(checkRes.data?.embeds![0].title).toContain('Free Games Check Triggered');
    expect(polledIds).toContain(1);
  });
});

// ── /reddit ───────────────────────────────────────────────────────────────────

describe('/reddit command', () => {
  it('has subcommands: add, list, remove, toggle, poll', () => {
    const subNames = redditCommandDef.options?.map((o) => o.name);
    expect(subNames).toContain('add');
    expect(subNames).toContain('list');
    expect(subNames).toContain('remove');
    expect(subNames).toContain('toggle');
    expect(subNames).toContain('poll');
  });

  it('adds a Reddit feed', async () => {
    const { deps, feeds } = makeDeps();
    const interaction = makeInteraction({
      data: {
        id: 'cmd-reddit',
        type: 1,
        name: 'reddit',
        options: [
          {
            name: 'add',
            type: 1,
            options: [
              { name: 'subreddit', type: 3, value: 'memes' },
            ],
          },
        ],
      },
    });

    const res = await handleRedditCommand(interaction, deps, {} as any);
    expect(feeds).toHaveLength(1);
    expect(feeds[0].feedType).toBe('reddit');
    expect(feeds[0].url).toBe('https://www.reddit.com/r/memes/.rss');
    expect(res.data?.embeds![0].title).toContain('Reddit Feed Added');
  });

  it('polls Reddit feeds manually', async () => {
    const { deps, polledIds } = makeDeps();
    await handleRedditCommand(
      makeInteraction({
        data: {
          id: 'cmd-rd-add',
          type: 1,
          name: 'reddit',
          options: [
            {
              name: 'add',
              type: 1,
              options: [
                { name: 'subreddit', type: 3, value: 'memes' },
              ],
            },
          ],
        },
      }),
      deps,
      {} as any,
    );

    const pollRes = await handleRedditCommand(
      makeInteraction({
        data: {
          id: 'cmd-rd-poll',
          type: 1,
          name: 'reddit',
          options: [{ name: 'poll', type: 1 }],
        },
      }),
      deps,
      {} as any,
    );
    expect(pollRes.data?.embeds![0].title).toContain('Reddit Check Triggered');
    expect(polledIds).toContain(1);
  });
});
