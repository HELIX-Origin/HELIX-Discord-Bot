/**
 * src/feed/github.ts
 *
 * GitHub feed syndication engine:
 * - Parses and validates repository slugs (owner/repo).
 * - Fetches public GitHub Events API with seamless fallback to public Atom feeds (zero API key needed).
 * - Parses incoming GitHub webhook notifications for real-time delivery.
 * - Formats rich, developer-grade GitLog and activity Discord embeds.
 */

import { fetchRaw } from './fetch.js';
import { parseFeed } from './parser.js';
import type { Feed } from '../state/types.js';
import type { DiscordEmbed, DiscordEmbedField } from '../bot/utils/types.js';

export type GitHubEventType = 'push' | 'release' | 'pull_request' | 'issues';

export const ALL_GITHUB_EVENTS: readonly GitHubEventType[] = ['push', 'release', 'pull_request', 'issues'];
export const DEFAULT_GITHUB_EVENTS: readonly GitHubEventType[] = ['push', 'release', 'pull_request', 'issues'];

export const GITHUB_ICON_URL = 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';

export interface GitHubSlug {
  owner: string;
  repo: string;
  slug: string; // "owner/repo"
  url: string;  // "https://github.com/owner/repo"
}

export interface GitHubCommitDetail {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  url: string;
}

export interface GitHubFeedItem {
  id: string; // Unique GUID for deduplication (e.g. github:push:owner/repo:sha)
  eventType: GitHubEventType;
  repoFullName: string;
  repoUrl: string;
  actor: {
    login: string;
    avatarUrl?: string;
    profileUrl?: string;
  };
  title: string;
  url: string;
  timestamp?: string;
  description?: string;
  branch?: string;
  commits?: GitHubCommitDetail[];
  releaseTag?: string;
  isPrerelease?: boolean;
  prNumber?: number;
  prAction?: 'opened' | 'closed' | 'merged' | 'reopened';
  prHead?: string;
  prBase?: string;
  prAdditions?: number;
  prDeletions?: number;
  prChangedFiles?: number;
  issueNumber?: number;
  issueAction?: 'opened' | 'closed' | 'reopened';
  issueLabels?: string[];
}

/**
 * Parses any GitHub URL or slug into a normalized { owner, repo, slug, url }.
 * Accepts "owner/repo", "https://github.com/owner/repo", "git@github.com:owner/repo.git", etc.
 */
export function parseGitHubSlug(input: string | undefined | null): GitHubSlug | null {
  if (!input) return null;
  let clean = input.trim();
  clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '');
  clean = clean.replace(/^git@github\.com:/i, '');
  clean = clean.replace(/^\/+|\/+$/g, '');
  clean = clean.replace(/\.git$/i, '');
  clean = clean.replace(/^\/+|\/+$/g, '');

  const parts = clean.split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  const owner = parts[0]?.trim();
  const repo = parts[1]?.trim();
  if (!owner || !repo) return null;

  // Basic sanity check on GitHub identifiers
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
    return null;
  }

  const slug = `${owner}/${repo}`;
  return {
    owner,
    repo,
    slug,
    url: `https://github.com/${slug}`,
  };
}

/**
 * Extracts the followed event types from a feed's scrape metadata or query string.
 */
export function parseGitHubEvents(raw?: string | null): GitHubEventType[] {
  if (!raw || !raw.trim()) {
    return [...DEFAULT_GITHUB_EVENTS];
  }
  const parts = raw.split(',').map((p) => p.trim().toLowerCase());
  const selected: GitHubEventType[] = [];
  for (const p of parts) {
    if (p === 'push' || p === 'commits' || p === 'commit') {
      if (!selected.includes('push')) selected.push('push');
    } else if (p === 'release' || p === 'releases' || p === 'tag' || p === 'tags') {
      if (!selected.includes('release')) selected.push('release');
    } else if (p === 'pull_request' || p === 'pr' || p === 'prs' || p === 'pull_requests') {
      if (!selected.includes('pull_request')) selected.push('pull_request');
    } else if (p === 'issues' || p === 'issue') {
      if (!selected.includes('issues')) selected.push('issues');
    }
  }
  return selected.length ? selected : [...DEFAULT_GITHUB_EVENTS];
}

/**
 * Parses an Atom commit/release feed entry into a GitHubFeedItem.
 */
export function parseAtomEntry(
  entry: {
    id?: string;
    title: string;
    link: string;
    publishedAt?: string | null;
    author?: string | null;
    description?: string | null;
    imageUrl?: string | null;
  },
  eventType: 'push' | 'release',
  slug: GitHubSlug,
): GitHubFeedItem {
  const isPush = eventType === 'push';
  const repoFullName = slug.slug;
  const repoUrl = slug.url;

  if (isPush) {
    // Extract commit SHA from URL or ID
    const shaMatch = entry.link.match(/\/commit\/([0-9a-fA-F]+)/) || (entry.id ? entry.id.match(/\/([0-9a-fA-F]{7,40})/) : null);
    const sha = shaMatch ? shaMatch[1] : (entry.id || entry.link);
    const shortSha = sha.slice(0, 7);
    const authorName = entry.author?.trim() || 'GitHub';
    const commitUrl = entry.link;

    // Clean description (strip HTML tags)
    const rawDesc = entry.description ? entry.description.replace(/<[^>]+>/g, '').trim() : '';
    const lines = rawDesc ? rawDesc.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    const firstLine = entry.title.replace(/\s+/g, ' ').trim();
    const bodyLines = lines.slice(1).join('\n');

    return {
      id: `github:push:${slug.slug}:${sha}`,
      eventType: 'push',
      repoFullName,
      repoUrl,
      actor: {
        login: authorName,
        avatarUrl: entry.imageUrl || undefined,
        profileUrl: `https://github.com/${authorName}`,
      },
      title: `🔨 [${repoFullName}] New commit: ${shortSha}`,
      url: commitUrl,
      timestamp: entry.publishedAt || undefined,
      description: bodyLines || undefined,
      commits: [
        {
          sha,
          shortSha,
          message: firstLine,
          author: authorName,
          url: commitUrl,
        },
      ],
    };
  } else {
    // Release
    const tagMatch = entry.link.match(/\/releases\/tag\/(.+)$/) || entry.title.match(/\b(v?[0-9]+\.[0-9]+[^\s]*)/i);
    const tag = tagMatch ? tagMatch[1] : entry.title.trim();
    const cleanDesc = entry.description ? entry.description.replace(/<[^>]+>/g, '').trim() : '';

    return {
      id: `github:release:${slug.slug}:${tag}`,
      eventType: 'release',
      repoFullName,
      repoUrl,
      actor: {
        login: entry.author?.trim() || slug.owner,
        avatarUrl: entry.imageUrl || undefined,
        profileUrl: `https://github.com/${entry.author?.trim() || slug.owner}`,
      },
      title: `🚀 [${repoFullName}] Release ${tag}`,
      url: entry.link,
      timestamp: entry.publishedAt || undefined,
      description: cleanDesc.slice(0, 1000) || undefined,
      releaseTag: tag,
    };
  }
}

/**
 * Parses a GitHub public API event object into a GitHubFeedItem.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseApiEvent(event: Record<string, any>, slug: GitHubSlug): GitHubFeedItem | null {
  const type = event['type'];
  const actor = event['actor'] || {};
  const payload = event['payload'] || {};
  const repoFullName = slug.slug;
  const repoUrl = slug.url;
  const createdAt = event['created_at'];

  const user = {
    login: actor['display_login'] || actor['login'] || slug.owner,
    avatarUrl: actor['avatar_url'],
    profileUrl: `https://github.com/${actor['login'] || slug.owner}`,
  };

  switch (type) {
    case 'PushEvent': {
      const ref = String(payload['ref'] || 'refs/heads/main');
      const branch = ref.replace('refs/heads/', '');
      const head = String(payload['head'] || event['id']);
      const commits = Array.isArray(payload['commits']) ? payload['commits'] : [];
      const commitCount = commits.length || (payload['size'] ? Number(payload['size']) : 1);
      const _shortHead = head.slice(0, 7);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const commitDetails: GitHubCommitDetail[] = commits.map((c: any) => ({
        sha: String(c.sha || ''),
        shortSha: String(c.sha || '').slice(0, 7),
        message: String(c.message || '').split('\n')[0] || 'Commit',
        author: c.author?.name || user.login,
        url: `https://github.com/${repoFullName}/commit/${c.sha}`,
      }));

      const title = commitCount === 1
        ? `🔨 [${repoFullName}:${branch}] New commit by ${user.login}`
        : `🔨 [${repoFullName}:${branch}] ${commitCount} new commits by ${user.login}`;

      const compareUrl = `https://github.com/${repoFullName}/compare/${payload['before'] || ''}...${head}`;

      return {
        id: `github:push:${repoFullName}:${head}`,
        eventType: 'push',
        repoFullName,
        repoUrl,
        actor: user,
        title,
        url: commitCount === 1 && commitDetails[0]?.url ? commitDetails[0].url : compareUrl,
        timestamp: createdAt,
        branch,
        commits: commitDetails,
      };
    }

    case 'ReleaseEvent': {
      const release = payload['release'] || {};
      const action = payload['action'] || 'published';
      if (action !== 'published') return null;

      const tag = release['tag_name'] || 'release';
      const name = release['name'] || tag;

      return {
        id: `github:release:${repoFullName}:${tag}`,
        eventType: 'release',
        repoFullName,
        repoUrl,
        actor: {
          login: release.author?.login || user.login,
          avatarUrl: release.author?.avatar_url || user.avatarUrl,
          profileUrl: release.author?.html_url || user.profileUrl,
        },
        title: `🚀 [${repoFullName}] Release ${tag}: ${name}`,
        url: release['html_url'] || `${repoUrl}/releases/tag/${tag}`,
        timestamp: release['published_at'] || createdAt,
        description: (release['body'] || '').slice(0, 1000),
        releaseTag: tag,
        isPrerelease: Boolean(release['prerelease']),
      };
    }

    case 'PullRequestEvent': {
      const pr = payload['pull_request'] || {};
      const action = payload['action'] as 'opened' | 'closed' | 'reopened' | undefined;
      if (!action || !['opened', 'closed', 'reopened'].includes(action)) return null;

      const isMerged = Boolean(pr['merged'] || (action === 'closed' && pr['merged_at']));
      const prAction: 'opened' | 'closed' | 'merged' | 'reopened' = isMerged ? 'merged' : action;
      const number = pr['number'] || payload['number'];
      const prTitle = pr['title'] || `PR #${number}`;

      const statusLabel = prAction === 'merged' ? 'Merged' : prAction === 'closed' ? 'Closed' : 'Opened';
      const icon = prAction === 'merged' ? '🟣' : prAction === 'closed' ? '🔴' : '🟢';

      return {
        id: `github:pr:${repoFullName}:${number}:${prAction}`,
        eventType: 'pull_request',
        repoFullName,
        repoUrl,
        actor: {
          login: pr.user?.login || user.login,
          avatarUrl: pr.user?.avatar_url || user.avatarUrl,
          profileUrl: pr.user?.html_url || user.profileUrl,
        },
        title: `${icon} [${repoFullName}] Pull Request #${number} ${statusLabel}: ${prTitle}`,
        url: pr['html_url'] || `${repoUrl}/pull/${number}`,
        timestamp: pr['updated_at'] || createdAt,
        description: (pr['body'] || '').slice(0, 800),
        prNumber: number,
        prAction,
        prHead: pr.head?.ref,
        prBase: pr.base?.ref,
        prAdditions: pr.additions,
        prDeletions: pr.deletions,
        prChangedFiles: pr.changed_files,
      };
    }

    case 'IssuesEvent': {
      const issue = payload['issue'] || {};
      const action = payload['action'] as 'opened' | 'closed' | 'reopened' | undefined;
      if (!action || !['opened', 'closed', 'reopened'].includes(action)) return null;

      const number = issue['number'] || payload['number'];
      const issueTitle = issue['title'] || `Issue #${number}`;
      const statusLabel = action === 'closed' ? 'Closed' : action === 'reopened' ? 'Reopened' : 'Opened';
      const icon = action === 'closed' ? '🟣' : '🟢';

       
      const labels = Array.isArray(issue['labels'])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? issue['labels'].map((l: any) => (typeof l === 'string' ? l : l.name)).filter(Boolean)
        : [];

      return {
        id: `github:issue:${repoFullName}:${number}:${action}`,
        eventType: 'issues',
        repoFullName,
        repoUrl,
        actor: {
          login: issue.user?.login || user.login,
          avatarUrl: issue.user?.avatar_url || user.avatarUrl,
          profileUrl: issue.user?.html_url || user.profileUrl,
        },
        title: `${icon} [${repoFullName}] Issue #${number} ${statusLabel}: ${issueTitle}`,
        url: issue['html_url'] || `${repoUrl}/issues/${number}`,
        timestamp: issue['updated_at'] || createdAt,
        description: (issue['body'] || '').slice(0, 800),
        issueNumber: number,
        issueAction: action,
        issueLabels: labels,
      };
    }

    default:
      return null;
  }
}

/**
 * Parses an incoming GitHub webhook payload into a GitHubFeedItem.
 */
 
export function parseGitHubWebhook(
  eventHeader: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>,
): GitHubFeedItem | null {
  const repo = payload['repository'] || {};
  const fullName = repo['full_name'] || repo['name'];
  if (!fullName) return null;
  const slug = parseGitHubSlug(fullName);
  if (!slug) return null;

  const sender = payload['sender'] || {};
  const user = {
    login: sender['login'] || slug.owner,
    avatarUrl: sender['avatar_url'],
    profileUrl: sender['html_url'] || `https://github.com/${sender['login'] || slug.owner}`,
  };

  switch (eventHeader.toLowerCase()) {
    case 'push': {
      const ref = String(payload['ref'] || 'refs/heads/main');
      const branch = ref.replace('refs/heads/', '');
      const head = String(payload['after'] || payload['head_commit']?.id || Date.now());
      const commits = Array.isArray(payload['commits']) ? payload['commits'] : [];
      const commitCount = commits.length || 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const commitDetails: GitHubCommitDetail[] = commits.map((c: any) => ({
        sha: String(c.id || c.sha || ''),
        shortSha: String(c.id || c.sha || '').slice(0, 7),
        message: String(c.message || '').split('\n')[0] || 'Commit',
        author: c.author?.name || c.author?.username || user.login,
        url: String(c.url || `https://github.com/${slug.slug}/commit/${c.id || c.sha}`),
      }));

      const title = commitCount === 1
        ? `🔨 [${slug.slug}:${branch}] New commit by ${user.login}`
        : `🔨 [${slug.slug}:${branch}] ${commitCount} new commits by ${user.login}`;

      return {
        id: `github:push:${slug.slug}:${head}`,
        eventType: 'push',
        repoFullName: slug.slug,
        repoUrl: slug.url,
        actor: user,
        title,
        url: payload['compare'] || (commitDetails[0]?.url ?? slug.url),
        branch,
        commits: commitDetails,
      };
    }

    case 'release': {
      const release = payload['release'] || {};
      const action = payload['action'] || 'published';
      if (action !== 'published') return null;

      const tag = release['tag_name'] || 'release';
      const name = release['name'] || tag;

      return {
        id: `github:release:${slug.slug}:${tag}`,
        eventType: 'release',
        repoFullName: slug.slug,
        repoUrl: slug.url,
        actor: {
          login: release.author?.login || user.login,
          avatarUrl: release.author?.avatar_url || user.avatarUrl,
          profileUrl: release.author?.html_url || user.profileUrl,
        },
        title: `🚀 [${slug.slug}] Release ${tag}: ${name}`,
        url: release['html_url'] || `${slug.url}/releases/tag/${tag}`,
        description: (release['body'] || '').slice(0, 1000),
        releaseTag: tag,
        isPrerelease: Boolean(release['prerelease']),
      };
    }

    case 'pull_request': {
      const pr = payload['pull_request'] || {};
      const action = payload['action'] as 'opened' | 'closed' | 'reopened' | undefined;
      if (!action || !['opened', 'closed', 'reopened'].includes(action)) return null;

      const isMerged = Boolean(pr['merged']);
      const prAction: 'opened' | 'closed' | 'merged' | 'reopened' = isMerged ? 'merged' : action;
      const number = pr['number'] || payload['number'];
      const prTitle = pr['title'] || `PR #${number}`;

      const statusLabel = prAction === 'merged' ? 'Merged' : prAction === 'closed' ? 'Closed' : 'Opened';
      const icon = prAction === 'merged' ? '🟣' : prAction === 'closed' ? '🔴' : '🟢';

      return {
        id: `github:pr:${slug.slug}:${number}:${prAction}`,
        eventType: 'pull_request',
        repoFullName: slug.slug,
        repoUrl: slug.url,
        actor: {
          login: pr.user?.login || user.login,
          avatarUrl: pr.user?.avatar_url || user.avatarUrl,
          profileUrl: pr.user?.html_url || user.profileUrl,
        },
        title: `${icon} [${slug.slug}] Pull Request #${number} ${statusLabel}: ${prTitle}`,
        url: pr['html_url'] || `${slug.url}/pull/${number}`,
        description: (pr['body'] || '').slice(0, 800),
        prNumber: number,
        prAction,
        prHead: pr.head?.ref,
        prBase: pr.base?.ref,
        prAdditions: pr.additions,
        prDeletions: pr.deletions,
        prChangedFiles: pr.changed_files,
      };
    }

    case 'issues': {
      const issue = payload['issue'] || {};
      const action = payload['action'] as 'opened' | 'closed' | 'reopened' | undefined;
      if (!action || !['opened', 'closed', 'reopened'].includes(action)) return null;

      const number = issue['number'] || payload['number'];
      const issueTitle = issue['title'] || `Issue #${number}`;
      const statusLabel = action === 'closed' ? 'Closed' : action === 'reopened' ? 'Reopened' : 'Opened';
      const icon = action === 'closed' ? '🟣' : '🟢';

       
      const labels = Array.isArray(issue['labels'])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? issue['labels'].map((l: any) => (typeof l === 'string' ? l : l.name)).filter(Boolean)
        : [];

      return {
        id: `github:issue:${slug.slug}:${number}:${action}`,
        eventType: 'issues',
        repoFullName: slug.slug,
        repoUrl: slug.url,
        actor: {
          login: issue.user?.login || user.login,
          avatarUrl: issue.user?.avatar_url || user.avatarUrl,
          profileUrl: issue.user?.html_url || user.profileUrl,
        },
        title: `${icon} [${slug.slug}] Issue #${number} ${statusLabel}: ${issueTitle}`,
        url: issue['html_url'] || `${slug.url}/issues/${number}`,
        description: (issue['body'] || '').slice(0, 800),
        issueNumber: number,
        issueAction: action,
        issueLabels: labels,
      };
    }

    default:
      return null;
  }
}

/**
 * Fetches feed items for a GitHub feed using public Events API or Atom feeds (zero key required).
 */
export async function fetchGitHubFeed(feed: Feed): Promise<GitHubFeedItem[]> {
  const slug = parseGitHubSlug(feed.url) || parseGitHubSlug(feed.scrape?.title ? `${feed.scrape.title}/${feed.scrape.link}` : null);
  if (!slug) return [];

  const allowedEvents = parseGitHubEvents(feed.scrape?.description);
  const items: GitHubFeedItem[] = [];

  // Try public GitHub Events API first
  let apiSuccess = false;
  try {
    const res = await fetchRaw(`https://api.github.com/repos/${slug.owner}/${slug.repo}/events`, {
      userAgent: 'HELIX-Discord-Bot/0.6.0',
      timeoutMs: 10_000,
    });

    if (res.status === 200 && res.text) {
      const data = JSON.parse(res.text);
      if (Array.isArray(data)) {
        apiSuccess = true;
        for (const raw of data) {
          const item = parseApiEvent(raw, slug);
          if (item && allowedEvents.includes(item.eventType)) {
            items.push(item);
          }
        }
      }
    }
  } catch {
    apiSuccess = false;
  }

  // If Events API returned results, return them
  if (apiSuccess && items.length > 0) {
    return items;
  }

  // Fallback to public Atom feeds (zero rate limits, zero tokens required)
  if (allowedEvents.includes('push')) {
    try {
      const res = await fetchRaw(`https://github.com/${slug.owner}/${slug.repo}/commits.atom`, {
        userAgent: 'HELIX-Discord-Bot/0.6.0',
        timeoutMs: 10_000,
      });
      if (res.status === 200 && res.text) {
        const parsed = parseFeed(res.text);
        for (const entry of parsed.entries) {
          items.push(parseAtomEntry(entry, 'push', slug));
        }
      }
    } catch {
      // Ignore network errors on fallback
    }
  }

  if (allowedEvents.includes('release')) {
    try {
      const res = await fetchRaw(`https://github.com/${slug.owner}/${slug.repo}/releases.atom`, {
        userAgent: 'HELIX-Discord-Bot/0.6.0',
        timeoutMs: 10_000,
      });
      if (res.status === 200 && res.text) {
        const parsed = parseFeed(res.text);
        for (const entry of parsed.entries) {
          items.push(parseAtomEntry(entry, 'release', slug));
        }
      }
    } catch {
      // Ignore network errors on fallback
    }
  }

  return items;
}

/**
 * Builds a rich developer-grade DiscordEmbed for a GitHub activity item.
 */
export function buildGitHubEmbed(item: GitHubFeedItem, brandIconUrl?: string | null): DiscordEmbed {
  const fields: DiscordEmbedField[] = [];

  // Color selection
  let color = 0x24292e; // GitHub Dark Slate
  let footerEvent = 'Activity';

  if (item.eventType === 'push') {
    color = 0x2da44e; // GitHub Green
    footerEvent = 'Git Log / Push';
    if (item.branch) {
      fields.push({ name: '📌 Branch', value: `\`${item.branch}\``, inline: true });
    }
    fields.push({ name: '📦 Repository', value: `[${item.repoFullName}](${item.repoUrl})`, inline: true });

    // Git log commit listing
    if (item.commits && item.commits.length > 0) {
      const commitLines: string[] = [];
      const displayCommits = item.commits.slice(0, 6);
      for (const c of displayCommits) {
        const short = c.shortSha ? `[\`${c.shortSha}\`](${c.url})` : '';
        const authorStr = c.author ? ` *by ${c.author}*` : '';
        commitLines.push(`${short} ${c.message}${authorStr}`);
      }
      if (item.commits.length > 6) {
        commitLines.push(`*... and ${item.commits.length - 6} more commit(s)*`);
      }
      fields.push({
        name: '📝 Commits',
        value: commitLines.join('\n').slice(0, 1024),
        inline: false,
      });
    }
  } else if (item.eventType === 'release') {
    color = 0x8957e5; // GitHub Purple
    footerEvent = 'Release';
    if (item.releaseTag) {
      fields.push({ name: '🏷️ Tag', value: `\`${item.releaseTag}\``, inline: true });
    }
    fields.push({
      name: '📦 Type',
      value: item.isPrerelease ? '⚠️ Pre-release' : '✅ Stable Release',
      inline: true,
    });
  } else if (item.eventType === 'pull_request') {
    footerEvent = 'Pull Request';
    if (item.prAction === 'merged') {
      color = 0x8957e5; // Purple
    } else if (item.prAction === 'closed') {
      color = 0xcf222e; // Red
    } else {
      color = 0x2da44e; // Green
    }

    if (item.prHead && item.prBase) {
      fields.push({ name: '🔀 Branches', value: `\`${item.prHead}\` → \`${item.prBase}\``, inline: true });
    }
    if (item.prAdditions !== undefined && item.prDeletions !== undefined) {
      const files = item.prChangedFiles ? ` in ${item.prChangedFiles} file(s)` : '';
      fields.push({
        name: '📊 Changes',
        value: `+${item.prAdditions} / -${item.prDeletions}${files}`,
        inline: true,
      });
    }
  } else if (item.eventType === 'issues') {
    footerEvent = 'Issue';
    if (item.issueAction === 'closed') {
      color = 0x8957e5; // Purple
    } else {
      color = 0x2da44e; // Green
    }
    if (item.issueLabels && item.issueLabels.length > 0) {
      fields.push({
        name: '🏷️ Labels',
        value: item.issueLabels.map((l) => `\`${l}\``).join(' '),
        inline: true,
      });
    }
  }

  const embed: DiscordEmbed = {
    title: item.title,
    url: item.url,
    color,
    author: {
      name: item.actor.login ? `${item.actor.login} (${item.repoFullName})` : item.repoFullName,
      icon_url: item.actor.avatarUrl || GITHUB_ICON_URL,
      url: item.actor.profileUrl || item.repoUrl,
    },
    footer: {
      text: `GitHub · ${footerEvent}`,
      icon_url: GITHUB_ICON_URL,
    },
  };

  if (brandIconUrl) {
    embed.thumbnail = { url: item.actor.avatarUrl || brandIconUrl };
  }

  if (item.description && item.description.trim()) {
    embed.description = item.description.slice(0, 1000);
  }

  if (fields.length > 0) {
    embed.fields = fields;
  }

  if (item.timestamp) {
    const d = new Date(item.timestamp);
    if (!Number.isNaN(d.getTime())) {
      embed.timestamp = d.toISOString();
    }
  }

  return embed;
}
