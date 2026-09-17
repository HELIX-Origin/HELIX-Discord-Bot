import { defaultConfig } from './config.js';
import { Database } from './db/database.js';
import { Repository } from './db/repository.js';
import { FeedWatcher } from './feed/watcher.js';
import { FeedThreadManager } from './feed/threads.js';
import { OAuthService } from './dashboard/oauth/service.js';
import { Scheduler } from './scheduler/scheduler.js';
import { createRedisCoordinator } from './state/redis.js';
import { createLogger } from './util/logger.js';
import { clearPorts } from './util/ports.js';
import { DiscordBot } from './bot/bot.js';
import { LavalinkManager } from './bot/music/lavalink.js';
import { WebhookRouter } from './dashboard/webhooks/router.js';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export async function main(): Promise<void> {
  const config = defaultConfig();
  const logger = createLogger('app', config.logLevel);

  // 1. Clear ports if currently occupied by lingering processes
  clearPorts([config.botPort, config.port], logger);

  const db = Database.open(config.dbPath);
  const repo = new Repository(db);
  const oauth = new OAuthService(repo, config);
  const redis = await createRedisCoordinator(config.logLevel);
  const feeds = new FeedWatcher(repo, redis, config.logLevel);

  // 3. Start background polling scheduler
  const scheduler = new Scheduler(config.logLevel);
  const savedInterval = repo.getSetting('poll_interval_ms');
  const initialInterval = savedInterval ? Number(savedInterval) : config.pollIntervalMs;
  scheduler.schedule('feed-poll', initialInterval, () => feeds.pollAllFeeds());
  scheduler.start();

  // Initialize webhook router for real-time feed updates
  const webhookRouter = new WebhookRouter(
    { config, db, repo, oauth, feeds, redis, scheduler, bot: null },
    config.logLevel,
  );

  // Lavalink music manager. Instantiated whenever the
  // music feature is enabled so both slash commands and the dashboard queue
  // page share the same in-memory player state. The bot connects to your own
  // external Lavalink v4 node (LAVA_HOST/PORT/SECURE/PASS); if it is not yet
  // reachable the manager keeps retrying in the background.
  let lavaManager: LavalinkManager | null = null;

  if (config.features.lavaEnabled) {
    logger.info('Connecting to external Lavalink server', {
      host: config.lava.host,
      port: config.lava.port,
      secure: config.lava.secure,
    });

    const manager = new LavalinkManager(config.lava, logger);
    lavaManager = manager;
    manager.connectWS().catch((err) => {
      logger.error('Failed to connect to Lavalink server (will keep retrying)', { error: (err as Error).message });
    });
  }

  // 4. Create Discord Bot as primary application process
  const bot = new DiscordBot(
    { config, db, repo, oauth, feeds, redis, scheduler, webhookRouter, lavaManager },
    {
      token: config.botToken || '',
      clientId: config.clientId,
      redirectUrl: config.redirectUrl,
      callbackUrl: config.callbackUrl,
      port: config.botPort,
      host: config.host,
    },
  );
  feeds.setBot(bot);
  webhookRouter.setBot(bot);
  webhookRouter.subscribeToAllFeeds();

  if (lavaManager) {
    lavaManager.setVoiceConnector({
      joinChannel: (guildId, channelId, deaf, mute) => bot.joinVoiceChannel(guildId, channelId, deaf, mute),
      leaveChannel: (guildId) => bot.leaveVoiceChannel(guildId),
    });
  }

  // 4b. Wire optional per-guild forum thread delivery (one thread per feed).
  const threads = new FeedThreadManager(repo, bot, config, config.logLevel);
  feeds.setThreads(threads);
  webhookRouter.setThreads(threads);
  scheduler.schedule('thread-keepalive', config.threadKeepaliveIntervalMs, () => threads.keepAliveAll());

  // 5. Start primary bot process (which starts Gateway, bot HTTP server, and site sub-process)
  await bot.start();
  void threads.keepAliveAll();

  logger.info('HELIX Discord Bot started with unified server', {
    host: config.host,
    port: config.botPort,
    dbPath: config.dbPath,
    botTokenConfigured: Boolean(config.botToken),
  });
  logger.info('Discord OAuth callback URL resolved', {
    callbackUrl: config.callbackUrl,
    source: process.env['DISCORD_CALLBACK_URL']?.trim()
      ? 'DISCORD_CALLBACK_URL'
      : config.publicBaseUrl
        ? 'PUBLIC_URL'
        : 'INTERNAL_URL',
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}; shutting down`);
    scheduler.stop();
    bot.stop();
    void (async () => {
      await redis?.close();
      db.close();
      logger.info('Shutdown complete');
      process.exit(0);
    })();
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

const isDirectRun =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();

if (isDirectRun) {
  main().catch((err) => {
    console.error('Failed to start HELIX Discord Bot:', err);
    process.exit(1);
  });
}
