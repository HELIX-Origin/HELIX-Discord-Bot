import type { Feed } from '../state/types.js';

interface FeedDeliveryTargets {
  channelId: string | null;
}

/**
 * Resolves the delivery target for a feed. Feeds deliver into a text/announcement
 * channel (`channelId`); when thread delivery is enabled for the guild, the bot
 * auto-creates one dedicated thread per feed inside that same channel.
 */
export function resolveFeedTargets(feed: Feed): FeedDeliveryTargets {
  return {
    channelId: feed.channelId ?? null,
  };
}
