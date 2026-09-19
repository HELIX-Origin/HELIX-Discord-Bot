export interface FeedNotifier {
  sendChannelMessage(channelId: string, payload: { content?: string; embeds?: unknown[] }): Promise<void>;
}

/**
 * Posts a short confirmation into a feed's target channel when a feed is added.
 * Failures are logged by the caller and never surface as command errors.
 */
export async function notifyFeedAdded(
  bot: FeedNotifier | null | undefined,
  channelId: string,
  feedName: string,
): Promise<void> {
  if (!bot || !channelId) return;
  await bot.sendChannelMessage(channelId, {
    content: `📡 **${feedName}** configured — updates will be posted here.`,
  });
}
