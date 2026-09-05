import { createBot, getBot } from './src/client.js';
import { BotCallbackServer } from './src/server.js';
import { getBotToken, getClientId, getPort, getCallbackUrl } from './src/env.js';
import { logs } from './src/handlers/logs-handler.js';
import { loadPrefixCommands, handlePrefixMessage } from './src/handlers/command-handler.js';
import { loadSlashCommands, registerGlobalSlashCommands, handleSlashInteraction } from './src/handlers/slash-handler.js';
import { loadEvents } from './src/handlers/event-handler.js';
import { loadAllPlugins } from './src/plugins/plugin-loader.js';
import { registerPlugins } from './src/plugins/registry.js';

export * from './src/client.js';
export * from './src/server.js';
export * from './src/db/database.js';
export * from './src/env.js';

export interface LaunchBotOptions {
  token?: string;
  callbackUrl?: string;
}

export async function launchBotAndDashboard(options: LaunchBotOptions = {}): Promise<{
  bot: ReturnType<typeof getBot>;
  server: BotCallbackServer;
}> {
  const token = options.token || getBotToken();
  const port = getPort();
  const callbackUrl = options.callbackUrl || getCallbackUrl();

  console.log('====================================================');
  console.log('  🤖 HELIX Discord Bot & Web Dashboard');
  console.log('====================================================\n');

  // Discover and register all language plugins
  try {
    const loadedPlugins = await loadAllPlugins();
    registerPlugins(loadedPlugins);
    logs.info(`Language Plugin System initialized: ${loadedPlugins.length} plugin(s) active.`);
  } catch (err: any) {
    logs.warn(`Plugin loader initialization warning: ${err.message}`);
  }

  const server = new BotCallbackServer({ callbackUrl });
  await server.start();

  let client = createBot(true);

  if (token) {
    try {
      await loadPrefixCommands();
      await loadSlashCommands();
      await loadEvents(client);

      logs.info('Connecting Discord Bot client to gateway...');

      client.on('error', (err) => {
        logs.error(`Discord client error: ${err.message}`);
      });

      client.on('shardError', (err) => {
        logs.error(`Discord WebSocket connection error: ${err.message}`);
      });

      try {
        await client.login(token);
        logs.success(`Discord Bot connected to gateway as ${client.user?.tag || 'HELIX Bot'}.`);
      } catch (err: any) {
        const isDisallowedIntents =
          err?.code === 'DisallowedIntents' ||
          (typeof err?.message === 'string' &&
            (err.message.toLowerCase().includes('disallowed intents') ||
              err.message.toLowerCase().includes('disallowedintents')));

        if (isDisallowedIntents) {
          logs.warn('Privileged Gateway Intent (MessageContent) is disabled in Discord Developer Portal.');
          logs.info('Retrying connection with standard intents (Guilds, GuildMessages)...');
          try {
            await client.destroy();
          } catch {}
          client = createBot(false);
          await loadEvents(client);
          await client.login(token);
          logs.success(`Discord Bot connected to gateway with fallback intents as ${client.user?.tag || 'HELIX Bot'} (Slash commands active).`);
          logs.info('To enable prefix commands (e.g. >help, >ticket), enable "Message Content Intent" in Discord Developer Portal -> Bot -> Privileged Gateway Intents.');
        } else if (err?.code === 'TokenInvalid' || (err?.message && err.message.toLowerCase().includes('invalid token'))) {
          logs.error('Invalid Discord Bot Token provided.');
          logs.warn('Verify you copied the Bot Token from Discord Developer Portal -> Bot -> Reset Token (do not use Client Secret or Client ID).');
        } else {
          throw err;
        }
      }

      const appId = client.user?.id || getClientId() || '';
      if (appId) {
        await registerGlobalSlashCommands(token, appId);
      }
    } catch (err: any) {
      logs.error(`Gateway error: ${err.message}`);
    }
  } else {
    logs.warn('No DISCORD_TOKEN found.');
    logs.info('Web dashboard is running. Configure your bot token to start.');
  }

  const shutdown = async () => {
    logs.info('Shutting down...');
    try {
      const bot = getBot();
      if (bot) await bot.destroy();
      await server.stop();
    } catch {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { bot: getBot(), server };
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('index.js') ||
  process.argv[1].endsWith('index.ts') ||
  process.argv[1].endsWith('HELIX/index.js') ||
  process.argv[1].endsWith('HELIX/index.ts')
);

if (isDirectRun) {
  launchBotAndDashboard().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
