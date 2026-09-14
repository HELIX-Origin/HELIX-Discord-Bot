import type { AppConfig } from './config.js';
import type { Database } from './db/database.js';
import type { Repository } from './db/repository.js';
import type { OAuthService } from './dashboard/oauth/service.js';
import type { FeedWatcher } from './feed/watcher.js';
import type { RedisCoordinator } from './state/redis.js';
import type { WebhookRouter } from './dashboard/webhooks/router.js';

import type { DiscordBot } from './bot/bot.js';
import type { NodeLinkManager } from './bot/music/nodelink.js';
import type { Scheduler } from './scheduler/scheduler.js';

export interface AppDeps {
  config: AppConfig;
  db: Database;
  repo: Repository;
  oauth: OAuthService;
  feeds: FeedWatcher;
  redis: RedisCoordinator | null;
  bot?: DiscordBot | null;
  scheduler?: Scheduler | null;
  webhookRouter?: WebhookRouter;
  nodeLinkManager?: NodeLinkManager | null;
}

/**
 * Resolve the application display name from the configured Discord bot application.
 * Falls back to the service's default name only when no bot context is available.
 */
export function appDisplayName(deps: AppDeps): string {
  return deps.bot?.getAppName() ?? 'HELIX Discord Bot';
}
