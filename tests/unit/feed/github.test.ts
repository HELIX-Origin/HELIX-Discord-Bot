import { describe, it, expect, vi } from 'vitest';
import {
  parseGitHubSlug,
  parseGitHubEvents,
  parseAtomEntry,
  parseApiEvent,
  parseGitHubWebhook,
  buildGitHubEmbed,
  fetchGitHubFeed,
  ALL_GITHUB_EVENTS,
  DEFAULT_GITHUB_EVENTS,
  GITHUB_ICON_URL,
  type GitHubSlug,
  type GitHubFeedItem,
  type GitHubEventType,
  type GitHubCommitDetail,
} from '../../../src/feed/github.js';
import type { Feed } from '../../../src/state/types.js';

describe('GitHub Feed Syndication Engine', () => {
  describe('Constants and Types', () => {
    it('defines all supported event types and defaults', () => {
      expect(ALL_GITHUB_EVENTS).toEqual(['push', 'release', 'pull_request', 'issues']);
      expect(DEFAULT_GITHUB_EVENTS).toEqual(['push', 'release', 'pull_request', 'issues']);
      expect(GITHUB_ICON_URL).toContain('github');
      const sampleType: GitHubEventType = 'push';
      expect(sampleType).toBe('push');
    });
  });

  describe('parseGitHubSlug()', () => {
    it('parses standard owner/repo format', () => {
      const res = parseGitHubSlug('HELIX-Origin/HELIX-Discord-Bot');
      expect(res).toEqual({
        owner: 'HELIX-Origin',
        repo: 'HELIX-Discord-Bot',
        slug: 'HELIX-Origin/HELIX-Discord-Bot',
        url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot',
      });
    });

    it('parses full https://github.com/owner/repo URLs', () => {
      const res = parseGitHubSlug('https://github.com/facebook/react');
      expect(res).not.toBeNull();
      expect(res?.owner).toBe('facebook');
      expect(res?.repo).toBe('react');
    });

    it('handles trailing slashes and .git extensions', () => {
      const res = parseGitHubSlug('https://github.com/torvalds/linux.git/');
      expect(res?.slug).toBe('torvalds/linux');
    });

    it('parses SSH git@ URLs', () => {
      const res = parseGitHubSlug('git@github.com:microsoft/vscode.git');
      expect(res?.slug).toBe('microsoft/vscode');
    });

    it('returns null for invalid inputs', () => {
      expect(parseGitHubSlug('')).toBeNull();
      expect(parseGitHubSlug(null)).toBeNull();
      expect(parseGitHubSlug('justareponame')).toBeNull();
      expect(parseGitHubSlug('invalid/slug/with/too/many/parts')).toBeNull();
    });
  });

  describe('parseGitHubEvents()', () => {
    it('returns default events when input is empty or null', () => {
      expect(parseGitHubEvents(null)).toEqual(DEFAULT_GITHUB_EVENTS);
      expect(parseGitHubEvents('')).toEqual(DEFAULT_GITHUB_EVENTS);
    });

    it('parses specific event subsets and aliases', () => {
      expect(parseGitHubEvents('push,release')).toEqual(['push', 'release']);
      expect(parseGitHubEvents('commits,releases')).toEqual(['push', 'release']);
      expect(parseGitHubEvents('pr,issue')).toEqual(['pull_request', 'issues']);
    });
  });

  describe('parseAtomEntry()', () => {
    const slug: GitHubSlug = {
      owner: 'HELIX-Origin',
      repo: 'HELIX-Discord-Bot',
      slug: 'HELIX-Origin/HELIX-Discord-Bot',
      url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot',
    };

    it('parses a commit entry from Atom XML', () => {
      const atomEntry = {
        id: 'tag:github.com,2008:Grit::Commit/d223a0e577b62e44cde8404ab8b767cb25572da6',
        title: 'docs: sync documentation',
        link: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/commit/d223a0e577b62e44cde8404ab8b767cb25572da6',
        author: 'PhantomNimbi',
        publishedAt: '2026-10-02T05:20:08Z',
        description: '<pre>docs: sync documentation\n\nDetailed explanation of changes</pre>',
        imageUrl: 'https://avatars.githubusercontent.com/u/171450393',
      };

      const item = parseAtomEntry(atomEntry, 'push', slug);
      expect(item.id).toBe('github:push:HELIX-Origin/HELIX-Discord-Bot:d223a0e577b62e44cde8404ab8b767cb25572da6');
      expect(item.eventType).toBe('push');
      expect(item.actor.login).toBe('PhantomNimbi');
      expect(item.commits).toHaveLength(1);
      expect(item.commits?.[0].shortSha).toBe('d223a0e');
    });

    it('parses a release entry from Atom XML', () => {
      const atomEntry = {
        id: 'tag:github.com,2008:Repository/123/v0.6.0',
        title: 'Release v0.6.0',
        link: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/releases/tag/v0.6.0',
        author: 'PhantomNimbi',
        publishedAt: '2026-10-01T20:00:00Z',
        description: '<h2>Changelog</h2><p>Major improvements</p>',
      };

      const item = parseAtomEntry(atomEntry, 'release', slug);
      expect(item.id).toBe('github:release:HELIX-Origin/HELIX-Discord-Bot:v0.6.0');
      expect(item.eventType).toBe('release');
      expect(item.releaseTag).toBe('v0.6.0');
      expect(item.description).toContain('Changelog');
    });
  });

  describe('parseApiEvent()', () => {
    const slug: GitHubSlug = {
      owner: 'HELIX-Origin',
      repo: 'HELIX-Discord-Bot',
      slug: 'HELIX-Origin/HELIX-Discord-Bot',
      url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot',
    };

    it('parses PushEvent', () => {
      const event = {
        id: '12345678',
        type: 'PushEvent',
        actor: { login: 'PhantomNimbi', avatar_url: 'https://avatars.githubusercontent.com/u/171450393' },
        payload: {
          ref: 'refs/heads/main',
          head: '26743f0f691ed187bfc879e0b4980b7794cf2fa3',
          before: 'd8985d19f2475917e3cee398f8094ef5900f3cfb',
          commits: [
            {
              sha: '26743f0f691ed187bfc879e0b4980b7794cf2fa3',
              message: 'fix: resolve bug in interaction scoping',
              author: { name: 'PhantomNimbi' },
            },
          ],
        },
        created_at: '2026-10-02T04:42:15Z',
      };

      const item = parseApiEvent(event, slug);
      expect(item).not.toBeNull();
      expect(item?.eventType).toBe('push');
      expect(item?.branch).toBe('main');
      expect(item?.commits).toHaveLength(1);
      expect(item?.commits?.[0].shortSha).toBe('26743f0');
    });

    it('parses ReleaseEvent', () => {
      const event = {
        type: 'ReleaseEvent',
        actor: { login: 'PhantomNimbi' },
        payload: {
          action: 'published',
          release: {
            tag_name: 'v1.0.0',
            name: 'v1.0.0 Stable',
            html_url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/releases/tag/v1.0.0',
            body: 'First stable release',
            prerelease: false,
          },
        },
        created_at: '2026-10-02T05:00:00Z',
      };

      const item = parseApiEvent(event, slug);
      expect(item).not.toBeNull();
      expect(item?.eventType).toBe('release');
      expect(item?.releaseTag).toBe('v1.0.0');
    });

    it('parses PullRequestEvent', () => {
      const event = {
        type: 'PullRequestEvent',
        actor: { login: 'contributor' },
        payload: {
          action: 'opened',
          number: 42,
          pull_request: {
            title: 'Add support for GitHub Feeds',
            html_url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/pull/42',
            body: 'Detailed PR description',
            user: { login: 'contributor' },
            head: { ref: 'feature/github-feeds' },
            base: { ref: 'main' },
            additions: 250,
            deletions: 12,
            changed_files: 5,
            merged: false,
          },
        },
        created_at: '2026-10-02T05:10:00Z',
      };

      const item = parseApiEvent(event, slug);
      expect(item).not.toBeNull();
      expect(item?.eventType).toBe('pull_request');
      expect(item?.prAction).toBe('opened');
      expect(item?.prNumber).toBe(42);
      expect(item?.prAdditions).toBe(250);
      expect(item?.prDeletions).toBe(12);
    });

    it('parses IssuesEvent', () => {
      const event = {
        type: 'IssuesEvent',
        actor: { login: 'user1' },
        payload: {
          action: 'opened',
          number: 10,
          issue: {
            title: 'Feature request: GitHub Feeds',
            html_url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/10',
            body: 'Please add github feeds',
            user: { login: 'user1' },
            labels: [{ name: 'enhancement' }],
          },
        },
        created_at: '2026-10-02T05:15:00Z',
      };

      const item = parseApiEvent(event, slug);
      expect(item).not.toBeNull();
      expect(item?.eventType).toBe('issues');
      expect(item?.issueNumber).toBe(10);
      expect(item?.issueLabels).toContain('enhancement');
    });
  });

  describe('parseGitHubWebhook()', () => {
    it('parses webhook push payload', () => {
      const payload = {
        ref: 'refs/heads/feature-branch',
        repository: { full_name: 'HELIX-Origin/HELIX-Discord-Bot' },
        sender: { login: 'PhantomNimbi' },
        after: '3a4b5c6d7e',
        compare: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/compare/before...after',
        commits: [
          {
            id: '3a4b5c6d7e8f',
            message: 'feat: add gitlog embed support',
            author: { name: 'PhantomNimbi' },
            url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/commit/3a4b5c6d7e8f',
          },
        ],
      };

      const item = parseGitHubWebhook('push', payload);
      expect(item).not.toBeNull();
      expect(item?.eventType).toBe('push');
      expect(item?.branch).toBe('feature-branch');
      expect(item?.title).toContain('New commit by PhantomNimbi');
    });

    it('parses webhook pull_request merged payload', () => {
      const payload = {
        action: 'closed',
        number: 15,
        repository: { full_name: 'HELIX-Origin/HELIX-Discord-Bot' },
        pull_request: {
          title: 'Implement Webhooks',
          html_url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/pull/15',
          merged: true,
          user: { login: 'PhantomNimbi' },
          head: { ref: 'feature/webhooks' },
          base: { ref: 'main' },
        },
      };

      const item = parseGitHubWebhook('pull_request', payload);
      expect(item).not.toBeNull();
      expect(item?.eventType).toBe('pull_request');
      expect(item?.prAction).toBe('merged');
      expect(item?.title).toContain('Merged');
    });
  });

  describe('buildGitHubEmbed()', () => {
    it('creates rich embed for push events', () => {
      const commit: GitHubCommitDetail = {
        sha: '1234567890abcdef',
        shortSha: '1234567',
        message: 'fix: resolve bug',
        author: 'PhantomNimbi',
        url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/commit/1234567890abcdef',
      };

      const item: GitHubFeedItem = {
        id: 'github:push:HELIX-Origin/HELIX-Discord-Bot:1234567',
        eventType: 'push',
        repoFullName: 'HELIX-Origin/HELIX-Discord-Bot',
        repoUrl: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot',
        actor: { login: 'PhantomNimbi' },
        title: '🔨 [HELIX-Origin/HELIX-Discord-Bot:main] 1 new commit',
        url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/commit/1234567890abcdef',
        branch: 'main',
        commits: [commit],
      };

      const embed = buildGitHubEmbed(item, 'https://example.com/icon.png');
      expect(embed.title).toBe(item.title);
      expect(embed.color).toBe(0x2da44e); // Green
      expect(embed.footer?.text).toContain('Git Log / Push');
      expect(embed.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: '📌 Branch', value: '`main`' }),
          expect.objectContaining({ name: '📝 Commits' }),
        ]),
      );
    });

    it('creates rich embed for pull requests', () => {
      const item: GitHubFeedItem = {
        id: 'github:pr:HELIX-Origin/HELIX-Discord-Bot:10:merged',
        eventType: 'pull_request',
        repoFullName: 'HELIX-Origin/HELIX-Discord-Bot',
        repoUrl: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot',
        actor: { login: 'PhantomNimbi' },
        title: '🟣 Pull Request #10 Merged',
        url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot/pull/10',
        prNumber: 10,
        prAction: 'merged',
        prHead: 'feature',
        prBase: 'main',
        prAdditions: 50,
        prDeletions: 10,
        prChangedFiles: 2,
      };

      const embed = buildGitHubEmbed(item);
      expect(embed.color).toBe(0x8957e5); // Purple for merged
      expect(embed.footer?.text).toContain('Pull Request');
    });
  });

  describe('fetchGitHubFeed()', () => {
    it('fetches and returns feed items using fallback Atom feed if API is unavailable', async () => {
      const feed: Feed = {
        id: 1,
        userId: 1,
        name: 'GitHub · HELIX Discord Bot',
        url: 'https://github.com/HELIX-Origin/HELIX-Discord-Bot',
        topic: 'GitHub',
        channelId: '123456',
        enabled: 1,
        feedType: 'github',
        scrape: {
          item: 'github',
          title: 'HELIX-Origin',
          link: 'HELIX-Discord-Bot',
          description: 'push,release',
        },
        lastEntryId: null,
        lastCheckedAt: null,
        lastPostedAt: null,
        createdAt: new Date().toISOString(),
        threadChannelId: null,
        threadEntryCount: 0,
        roleId: null,
      };

      // Mock fetchRaw to simulate Atom response
      const fetchModule = await import('../../../src/feed/fetch.js');
      const spy = vi.spyOn(fetchModule, 'fetchRaw').mockImplementation(async (url: string) => {
        if (url.includes('/commits.atom')) {
          return {
            url,
            status: 200,
            contentType: 'application/atom+xml',
            body: new Uint8Array(),
            text: `<?xml version="1.0" encoding="UTF-8"?>
              <feed xmlns="http://www.w3.org/2005/Atom">
                <entry>
                  <id>tag:github.com,2008:Grit::Commit/abcdef1234567890</id>
                  <link type="text/html" rel="alternate" href="https://github.com/HELIX-Origin/HELIX-Discord-Bot/commit/abcdef1234567890"/>
                  <title>feat: mock commit</title>
                  <updated>2026-10-02T05:00:00Z</updated>
                  <author><name>PhantomNimbi</name></author>
                  <content type="html">&lt;pre&gt;mock description&lt;/pre&gt;</content>
                </entry>
              </feed>`,
            durationMs: 50,
            challenged: false,
          };
        }
        return {
          url,
          status: 403,
          contentType: 'application/json',
          body: new Uint8Array(),
          text: '{"message": "rate limit exceeded"}',
          durationMs: 50,
          challenged: false,
        };
      });

      const items = await fetchGitHubFeed(feed);
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items[0].eventType).toBe('push');
      expect(items[0].title).toContain('abcdef1');

      spy.mockRestore();
    });
  });
});
