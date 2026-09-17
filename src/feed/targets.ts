import type { Feed } from '../state/types.js';

export interface FeedDeliveryTargets {
  channelId: string | null;
  forumChannelId: string | null;
}

/**
 * Resolves the delivery target for a feed. Each feed carries its own target:
 * either a text/announcement channel (`channelId`) or a forum channel where the
 * bot auto-creates one dedicated thread per feed (`forumChannelId`).
 */
export function resolveFeedTargets(feed: Feed): FeedDeliveryTargets {
  return {
    channelId: feed.channelId ?? null,
    forumChannelId: feed.forumChannelId ?? null,
  };
}
