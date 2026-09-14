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
import { NodeLinkManager } from './bot/music/nodelink.js';
import { WebhookRouter } from './dashboard/webhooks/router.js';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

export async function main(): Promise<void> {
  const config = defaultConfig();
  const logger = createLogger('app', config.logLevel);

  // 1. Clear ports if currently occupied by lingering processes
  clearPorts([config.botPort, config.port], logger);

  const db = Database.open(config.dbPath);
  const repo = new Repository(db);
  const oauth = new OAuthService(repo, config);
  const redis = await createRedisCoordinator(config.redisUri, config.logLevel);
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

  // NodeLink music manager (Lavalink-compatible). Instantiated whenever the
  // music feature is enabled so both slash commands and the dashboard queue
  // page share the same in-memory player state.
  let nodeLinkManager: NodeLinkManager | null = null;
  let nodeLinkProcess: ReturnType<typeof spawn> | null = null;

  if (config.features.nodeLinkEnabled) {
    // Start internal NodeLink server if not using external node
    if (!config.nodeLinkExternal) {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const nodeLinkJar = resolve(__dirname, '..', '..', 'nodelink', 'NodeLink.jar');
      nodeLinkProcess = spawn('java', ['-jar', nodeLinkJar], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODELINK_HOST: config.nodeLink.host,
          NODELINK_PORT: String(config.nodeLink.port),
          NODELINK_SECURE: String(config.nodeLink.secure),
          NODELINK_PASSWORD: config.nodeLink.password,
        },
      });

      nodeLinkProcess.stdout?.on('data', (data: Buffer) => {
        logger.debug('NodeLink stdout', { output: data.toString().trim() });
      });
      nodeLinkProcess.stderr?.on('data', (data: Buffer) => {
        logger.warn('NodeLink stderr', { output: data.toString().trim() });
      });
      nodeLinkProcess.on('error', (err: Error) => {
        logger.error('NodeLink process error', { error: err.message });
      });
      nodeLinkProcess.on('exit', (code: number | null) => {
        logger.warn('NodeLink process exited', { code });
      });

      logger.info('Starting internal NodeLink server', {
        host: config.nodeLink.host,
        port: config.nodeLink.port,
        secure: config.nodeLink.secure,
      });

      // Wait a moment for NodeLink to start up
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      logger.info('NodeLink external mode enabled — connecting to external NodeLink node', {
        host: config.nodeLink.host,
        port: config.nodeLink.port,
        secure: config.nodeLink.secure,
      });
    }

    nodeLinkManager = new NodeLinkManager(config.nodeLink, logger);
    nodeLinkManager.connectWS().catch(() => {});
  }

  // 4. Create Discord Bot as primary application process
  const bot = new DiscordBot(
    { config, db, repo, oauth, feeds, redis, scheduler, webhookRouter, nodeLinkManager },
    {
      token: config.botToken || '',
      clientId: config.clientId,
      redirectUrl: config.redirectUrl,
      callbackUrl: config.callbackUrl,
      port: config.botPort,
      host: config.host,
      sslKey: config.botSslKey,
      sslCert: config.botSslCert,
    },
  );
  feeds.setBot(bot);
  webhookRouter.setBot(bot);
  webhookRouter.subscribeToAllFeeds();

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
    if (nodeLinkProcess) {
      logger.info('Stopping internal NodeLink server');
      nodeLinkProcess.kill('SIGTERM');
      // Force kill after 2 seconds if not terminated
      setTimeout(() => {
        if (!nodeLinkProcess!.killed) {
          nodeLinkProcess!.kill('SIGKILL');
        }
      }, 2000);
    }
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
