import { existsSync, promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { fetchRaw } from './fetch.js';

export type RedditNsfwStatus = 'nsfw' | 'sfw' | 'unverifiable';

export interface RedditFeedsService {
  available(): boolean;
  detectNsfw(subreddit: string): Promise<RedditNsfwStatus>;
  assertTargetAllowed(subreddit: string, targetChannelNsfw: boolean): Promise<void>;
  subredditFromUrlOrName(input: string): string | null;
}

const CHECK_TTL_MS = 60 * 1000;
const NSFW_TTL_MS = 6 * 60 * 60 * 1000;
const REDDIT_PROBE_TIMEOUT_MS = 10_000;
const REDDIT_PROBE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/**
 * Resolve the Reddit session cookie file. Order: REDDIT_COOKIES_FILE env, then
 * cookies.json (preferred), then cookies.txt (fallback).
 */
export function redditCookiesFilePath(): string {
  const envPath = process.env['REDDIT_COOKIES_FILE']?.trim();
  if (envPath) return resolve(envPath);
  const jsonCandidate = resolve(process.cwd(), 'cookies.json');
  if (existsSync(jsonCandidate)) return jsonCandidate;
  return resolve(process.cwd(), 'cookies.txt');
}

let availabilityCache: { at: number; available: boolean; file: string } | null = null;

/** True when a Reddit session cookie file exists (cached for 60s). */
export function redditFeedsAvailable(): boolean {
  const file = redditCookiesFilePath();
  const now = Date.now();
  if (availabilityCache && availabilityCache.file === file && now - availabilityCache.at < CHECK_TTL_MS) {
    return availabilityCache.available;
  }
  const available = existsSync(file);
  availabilityCache = { at: now, available, file };
  return available;
}

function domainMatchesCookie(host: string, domain: unknown, hostOnly: boolean): boolean {
  if (typeof domain !== 'string') return false;
  let normalized = domain.trim().toLowerCase();
  if (normalized.startsWith('.')) normalized = normalized.slice(1);
  if (normalized === host) return true;
  return !hostOnly && host.endsWith(`.${normalized}`);
}

/**
 * Parse a Netscape-style cookie file (the cookies.txt fallback format).
 * Lines are `domain\tincludeSubdomains\tpath\tsecure\texpiry\tname\tvalue` where
 * expiry is a Unix timestamp in seconds (0 = session). `#HttpOnly_` prefixes the
 * domain field, not the comment marker.
 */
export function parseNetscapeCookies(text: string): string | null {
  const host = 'www.reddit.com';
  const nowSeconds = Math.floor(Date.now() / 1000);
  const pairs: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (line === '') continue;
    if (line.startsWith('#')) {
      if (line.startsWith('#HttpOnly_')) line = line.slice('#HttpOnly_'.length);
      else continue;
    }
    const fields = line.split('\t');
    if (fields.length < 7) continue;
    const [domainRaw, includeSubdomainsRaw, , , expiryRaw, name, value] = fields;
    if (name.includes(';') || value.includes(';')) continue;
    const includeSubdomains = includeSubdomainsRaw.trim().toUpperCase() === 'TRUE';
    if (!domainMatchesCookie(host, domainRaw, !includeSubdomains)) continue;
    const expiry = Number.parseInt(expiryRaw, 10);
    if (!Number.isNaN(expiry) && expiry !== 0 && expiry <= nowSeconds) continue;
    pairs.push(`${name}=${value}`);
  }
  if (pairs.length === 0) return null;
  return pairs.join('; ');
}

/**
 * Parse a cookies.json file (the preferred format, e.g. from the
 * "Get Cookies Locally" browser extension). Supports both a top-level array
 * and a `{ cookies: [...] }` wrapper.
 */
export function parseJsonCookies(text: string): string | null {
  const host = 'www.reddit.com';
  const nowSeconds = Math.floor(Date.now() / 1000);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const list = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { cookies?: unknown[] }).cookies)
      ? (parsed as { cookies: unknown[] }).cookies
      : null;
  if (list === null) return null;

  const pairs: string[] = [];
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue;
    const cookie = item as Record<string, unknown>;
    const name = cookie['name'];
    const value = cookie['value'];
    if (typeof name !== 'string' || typeof value !== 'string' || name.includes(';') || value.includes(';')) continue;
    const hostOnly = cookie['hostOnly'] === true;
    if (!domainMatchesCookie(host, cookie['domain'], hostOnly)) continue;

    const session = cookie['session'] === true;
    const rawExpiry = typeof cookie['expirationDate'] === 'number' ? cookie['expirationDate'] : cookie['expires'];
    let expiry = typeof rawExpiry === 'number' ? rawExpiry : 0;
    if (expiry > 1e11) expiry = expiry / 1000;
    if (!session && expiry !== 0 && expiry <= nowSeconds) continue;
    pairs.push(`${name}=${value}`);
  }
  if (pairs.length === 0) return null;
  return pairs.join('; ');
}

let cookieHeaderCache: { at: number; file: string; mtimeMs: number; size: number; header: string | null } | null = null;

async function readRedditCookieHeader(): Promise<string | null> {
  const file = redditCookiesFilePath();
  try {
    const stat = await fs.stat(file);
    if (
      cookieHeaderCache &&
      cookieHeaderCache.file === file &&
      Date.now() - cookieHeaderCache.at < CHECK_TTL_MS &&
      cookieHeaderCache.mtimeMs === stat.mtimeMs &&
      cookieHeaderCache.size === stat.size
    ) {
      return cookieHeaderCache.header;
    }
    const text = await fs.readFile(file, 'utf8');
    const looksJson = file.toLowerCase().endsWith('.json') || /^\s*[[{]/.test(text);
    const header = looksJson ? parseJsonCookies(text) : parseNetscapeCookies(text);
    cookieHeaderCache = { at: Date.now(), file, mtimeMs: stat.mtimeMs, size: stat.size, header };
    return header;
  } catch {
    cookieHeaderCache = null;
    return null;
  }
}

const nsfwCache = new Map<string, { value: RedditNsfwStatus; at: number }>();

export function clearRedditNsfwCache(): void {
  nsfwCache.clear();
}

export function clearRedditCookieCache(): void {
  availabilityCache = null;
  cookieHeaderCache = null;
}

/**
 * Best-effort NSFW detection for a subreddit using the authenticated
 * `about.json` endpoint. Returns 'unverifiable' when no session cookie exists
 * or the probe fails, so callers can fail closed.
 */
export async function detectSubredditNsfw(subreddit: string): Promise<RedditNsfwStatus> {
  const sub = subreddit.replace(/^r\//i, '').trim();
  if (!sub) return 'unverifiable';
  const hit = nsfwCache.get(sub);
  if (hit && Date.now() - hit.at < NSFW_TTL_MS) return hit.value;

  let status: RedditNsfwStatus = 'unverifiable';
  const cookie = await readRedditCookieHeader();
  if (cookie !== null) {
    try {
      const res = await fetchRaw(`https://www.reddit.com/r/${encodeURIComponent(sub)}/about.json`, {
        timeoutMs: REDDIT_PROBE_TIMEOUT_MS,
        cookie,
        userAgent: REDDIT_PROBE_USER_AGENT,
      });
      if (res.status === 200) {
        const data = JSON.parse(res.text) as { data?: { over18?: unknown } };
        const over18 = data?.data?.over18;
        if (typeof over18 === 'boolean') status = over18 ? 'nsfw' : 'sfw';
      }
    } catch {
      // probe failed; treated as unverifiable
    }
  }
  nsfwCache.set(sub, { value: status, at: Date.now() });
  return status;
}

/** Normalize a subreddit name or URL into the bare subreddit slug. */
export function subredditFromUrlOrName(input: string): string | null {
  let value = input.trim();
  if (!value) return null;
  value = value.replace(/^https?:\/\/([\w-]+\.)*reddit\.com\/r\//i, '');
  value = value.replace(/^\//, '');
  value = value.replace(/^r\//i, '');
  value = value.split(/[/?#]/)[0].trim();
  return value || null;
}

/**
 * Enforce the age-restriction rule: only verified-SFW subreddits may target a
 * channel that is not age-restricted. NSFW or unverifiable subreddits require
 * an age-restricted (NSFW) target channel or thread.
 */
export async function assertRedditTargetAllowed(subreddit: string, targetChannelNsfw: boolean): Promise<void> {
  if (targetChannelNsfw) return;
  const status = await detectSubredditNsfw(subreddit);
  if (status === 'sfw') return;
  if (status === 'nsfw') {
    throw new Error(
      `r/${subreddit} is flagged NSFW and can only be delivered to an age-restricted (NSFW) channel or thread.`,
    );
  }
  throw new Error(
    `r/${subreddit}'s content rating could not be verified, so it can only be delivered to an age-restricted (NSFW) channel or thread.`,
  );
}

export function createRedditFeeds(): RedditFeedsService {
  return {
    available: redditFeedsAvailable,
    detectNsfw: detectSubredditNsfw,
    assertTargetAllowed: assertRedditTargetAllowed,
    subredditFromUrlOrName,
  };
}
