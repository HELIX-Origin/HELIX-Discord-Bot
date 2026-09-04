import { createBot, getBot } from './src/client.js';
import { BotCallbackServer } from './src/server.js';
import { getBotToken, getPort, getCallbackUrl } from './src/env.js';
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
  port?: number;
  callbackUrl?: string;
}

export async function launchBotAndDashboard(options: LaunchBotOptions = {}): Promise<{
  bot: ReturnType<typeof getBot>;
  server: BotCallbackServer;
}> {
  const token = options.token || getBotToken();
  const port = options.port || getPort();
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

  const server = new BotCallbackServer({ callbackUrl, port });
  await server.start();

  const client = createBot();

  if (token) {
    try {
      await loadPrefixCommands();
      await loadSlashCommands();
      await loadEvents(client);

      client.on('messageCreate', (message) => handlePrefixMessage(message));
      client.on('interactionCreate', (interaction) => {
        if (interaction.isChatInputCommand()) handleSlashInteraction(interaction);
      });

      await registerGlobalSlashCommands(token, client.user?.id || '');

      await client.login(token);
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
