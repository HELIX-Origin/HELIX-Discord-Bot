import type { AppDeps } from '../../../app.js';
import { EmbedHandler } from '../embeds/builder.js';
import type { DiscordEmbed } from '../../utils/types.js';

export interface FeedEntryPayload {
  title: string;
  url: string;
  author?: string | null;
  content?: string | null;
  publishedAt?: string | null;
  imageUrl?: string | null;
  feedName: string;
  feedType?: string | null;
}

export function buildFeedEntryEmbed(entry: FeedEntryPayload, deps: AppDeps): DiscordEmbed {
  const h = EmbedHandler.for(deps).primary();

  h.title(entry.title).url(entry.url);

  if (entry.content) {
    // Strip HTML tags if any remain
    const cleanText = entry.content.replace(/<[^>]+>/g, '').trim();
    if (cleanText) {
      h.description(cleanText, 350);
    }
  }

  if (entry.imageUrl) {
    if (entry.feedType === 'reddit') {
      h.image(entry.imageUrl);
    } else {
      h.thumbnail(entry.imageUrl);
    }
  }

  const footerText = entry.author ? `${entry.feedName} • ${entry.author}` : entry.feedName;
  h.footer(footerText);

  return h.build();
}
