import type { Repository } from '../db/repository.js';
import { feedCategory, type Feed } from '../state/types.js';

export interface FeedDeliveryTargets {
  channelId: string | null;
  threadChannelId: string | null;
}

/**
 * Resolves the delivery targets for a feed, preferring the per-guild,
 * per-category binding (RSS/Reddit/FreeGames/StreamAlerts) configured in the
 * dashboard and falling back to the legacy feed-level channel/thread fields.
 */
export function resolveFeedTargets(repo: Pick<Repository, 'getGuildCategoryTarget'>, feed: Feed): FeedDeliveryTargets {
  const category = feed.guildId ? feedCategory(feed.feedType) : null;
  const target = category && feed.guildId ? repo.getGuildCategoryTarget(feed.guildId, category) : null;
  return {
    channelId: target?.channelId ?? feed.channelId ?? null,
    threadChannelId: target?.threadChannelId ?? feed.threadChannelId ?? null,
  };
}
