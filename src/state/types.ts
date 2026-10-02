export type UserRole = 'owner' | 'admin' | 'member';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Session {
  id: number;
  userId: number;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface OAuthConnection {
  id: number;
  userId: number;
  provider: string;
  providerAccountId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface OAuthState {
  state: string;
  userId: number | null;
  provider: string;
  createdAt: string;
}

export type FeedCategory = 'rss' | 'reddit' | 'freegames' | 'gamedeals' | 'patchnotes' | 'streamalerts' | 'github';

export interface GuildCategory {
  guildId: string;
  category: FeedCategory;
  channelId: string | null;
  threadChannelId: string | null;
  updatedAt: string;
}

/**
 * Canonical feed type identifier union.
 *
 * Derived from the `FEED_TYPES` tuple further below so the compile-time type
 * and the runtime validation list can never drift apart. Add new feed types to
 * that tuple; this union follows automatically.
 */
export type FeedType = (typeof FEED_TYPES)[number];

/**
 * Runtime mirror of the `FeedType` union.
 *
 * Declared as a tuple first so the union is *derived* from it: a feed type can
 * never be added to the compile-time union without also being accepted by
 * `isFeedType()` at runtime. Keeping these two lists in sync by hand previously
 * let dashboard-created `game_deals_*` / `game_patchnotes_*` feeds fall through
 * `rowToFeed()` and get silently coerced to `rss`.
 */
const FEED_TYPES = [
  'rss',
  'scrape',
  'reddit',
  'free_games',
  'free_games_gamerpower',
  'free_games_epic',
  'free_games_steam',
  'free_games_gog',
  'free_games_indiegala',
  'free_games_humble',
  'free_games_itchio',
  'free_games_ubisoft',
  'free_games_ea',
  'free_games_prime',
  'free_games_battlenet',
  'free_games_stove',
  'game_deals',
  'game_deals_all',
  'game_deals_steam',
  'game_deals_gog',
  'game_deals_epic',
  'game_deals_humble',
  'game_deals_gamerpower',
  'game_patchnotes',
  'game_patchnotes_steam',
  'game_patchnotes_rss',
  'game_patchnotes_cs2',
  'game_patchnotes_dota2',
  'game_patchnotes_rust',
  'game_patchnotes_helldivers2',
  'game_patchnotes_apex',
  'game_patchnotes_cyberpunk',
  'game_patchnotes_bg3',
  'game_patchnotes_terraria',
  'game_patchnotes_dbd',
  'game_patchnotes_warframe',
  'game_patchnotes_nomansky',
  'youtube',
  'twitch',
  'github',
] as const;

function isFeedType(value: unknown): value is FeedType {
  return typeof value === 'string' && (FEED_TYPES as readonly string[]).includes(value);
}

export interface Feed {
  id: number;
  userId: number;
  name: string;
  url: string;
  topic: string | null;
  channelId: string | null;
  guildId?: string | null;
  enabled: number;
  feedType: FeedType;
  scrape: { item: string; title: string; link: string; description?: string } | null;
  lastEntryId: string | null;
  lastCheckedAt: string | null;
  lastPostedAt: string | null;
  createdAt: string;
  threadChannelId: string | null;
  threadEntryCount: number;
  roleId: string | null;
}

export interface DiscordGuild {
  guildId: string;
  userId: number;
  name: string;
  createdAt: string;
  threadsEnabled: number;
}

export interface ActivityEntry {
  ts: string;
  userId: number | null;
  level: string;
  source: string;
  message: string;
}

export const nowIso = (): string => new Date().toISOString();

type Row = Record<string, unknown>;

export const rowToUser = (r: Row | undefined): User | null => {
  if (!r) return null;
  const id = Number(r.id);
  const rawRole = r.role !== undefined && r.role !== null ? String(r.role) : '';
  const role: UserRole =
    rawRole === 'owner' || rawRole === 'admin' || rawRole === 'member'
      ? (rawRole as UserRole)
      : rawRole === 'user'
        ? 'member'
        : id === 1
          ? 'owner'
          : 'member';
  return {
    id,
    email: String(r.email),
    passwordHash: String(r.password_hash),
    displayName: String(r.display_name),
    role,
    createdAt: String(r.created_at),
  };
};

export const rowToSession = (r: Row | undefined): Session | null => {
  if (!r) return null;
  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    token: String(r.token),
    createdAt: String(r.created_at),
    expiresAt: String(r.expires_at),
  };
};

export const rowToOAuthConnection = (r: Row | undefined): OAuthConnection | null => {
  if (!r) return null;
  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    provider: String(r.provider),
    providerAccountId: String(r.provider_account_id),
    accessToken: String(r.access_token),
    refreshToken: r.refresh_token === null ? null : String(r.refresh_token),
    expiresAt: r.expires_at === null ? null : String(r.expires_at),
    createdAt: String(r.created_at),
  };
};

export const rowToFeed = (r: Row | undefined): Feed | null => {
  if (!r) return null;
  const scrapeItem = r.scrape_item === null || r.scrape_item === undefined ? null : String(r.scrape_item);
  const scrapeTitle = r.scrape_title === null || r.scrape_title === undefined ? null : String(r.scrape_title);
  const scrapeLink = r.scrape_link === null || r.scrape_link === undefined ? null : String(r.scrape_link);
  const scrapeDescription =
    r.scrape_description === null || r.scrape_description === undefined ? null : String(r.scrape_description);
  const channelId = r.channel_id !== null && r.channel_id !== undefined ? String(r.channel_id) : null;
  const guildId = r.guild_id !== null && r.guild_id !== undefined ? String(r.guild_id) : null;
  const rawFeedType = r.feed_type === null || r.feed_type === undefined ? 'rss' : String(r.feed_type);
  const feedType: FeedType = isFeedType(rawFeedType) ? rawFeedType : 'rss';
  const topic = r.topic !== null && r.topic !== undefined && String(r.topic).trim() ? String(r.topic).trim() : null;
  const threadChannelId =
    r.thread_channel_id !== null && r.thread_channel_id !== undefined ? String(r.thread_channel_id) : null;
  const threadEntryCount = Number(r.thread_entry_count ?? 0);
  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    name: String(r.name),
    url: String(r.url),
    topic,
    channelId,
    guildId,
    enabled: Number(r.enabled),
    roleId: r.role_id !== null && r.role_id !== undefined ? String(r.role_id) : null,
    feedType,
    scrape:
      scrapeItem && scrapeTitle && scrapeLink
        ? { item: scrapeItem, title: scrapeTitle, link: scrapeLink, description: scrapeDescription ?? undefined }
        : null,
    lastEntryId: r.last_entry_id === null ? null : String(r.last_entry_id),
    lastCheckedAt: r.last_checked_at === null ? null : String(r.last_checked_at),
    lastPostedAt: r.last_posted_at === null || r.last_posted_at === undefined ? null : String(r.last_posted_at),
    createdAt: String(r.created_at),
    threadChannelId,
    threadEntryCount,
  };
};

export const rowToDiscordGuild = (r: Row | undefined): DiscordGuild | null => {
  if (!r) return null;
  return {
    guildId: String(r.guild_id),
    userId: Number(r.user_id),
    name: String(r.name ?? ''),
    createdAt: String(r.created_at),
    threadsEnabled: Number(r.threads_enabled ?? 0),
  };
};

export const rowToGuildCategory = (r: Row | undefined): GuildCategory | null => {
  if (!r) return null;
  const category = String(r.category);
  if (
    category !== 'rss' &&
    category !== 'reddit' &&
    category !== 'freegames' &&
    category !== 'gamedeals' &&
    category !== 'patchnotes' &&
    category !== 'streamalerts' &&
    category !== 'github'
  )
    return null;
  return {
    guildId: String(r.guild_id),
    category: category as FeedCategory,
    channelId: r.channel_id === null || r.channel_id === undefined ? null : String(r.channel_id),
    threadChannelId:
      r.thread_channel_id === null || r.thread_channel_id === undefined ? null : String(r.thread_channel_id),
    updatedAt: String(r.updated_at),
  };
};

export function feedCategory(feedType: FeedType): FeedCategory | null {
  if (!feedType) return null;
  if (feedType === 'reddit') return 'reddit';
  if (feedType === 'rss' || feedType === 'scrape') return 'rss';
  if (feedType.startsWith('free_games')) return 'freegames';
  if (feedType.startsWith('game_deals')) return 'gamedeals';
  if (feedType.startsWith('game_patchnotes')) return 'patchnotes';
  if (feedType === 'youtube' || feedType === 'twitch') return 'streamalerts';
  if (feedType === 'github') return 'github';
  return null;
}

/**
 * Per-category subscription caps (dashboard "tab" limits). Categories absent
 * from this map are unlimited.
 */
export const FEED_CATEGORY_LIMITS: Readonly<Partial<Record<FeedCategory, number>>> = {
  rss: 10,
  reddit: 10,
  github: 10,
};
