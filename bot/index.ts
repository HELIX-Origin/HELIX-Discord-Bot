import { HelixBotClient } from './src/client.js';
import { BotCallbackServer } from './src/server.js';
import { getBotToken, getPort, getCallbackUrl } from './src/env.js';

export * from './src/index.js';
export * from './dashboard/index.js';

export interface LaunchBotOptions {
  token?: string;
  port?: number;
  callbackUrl?: string;
}

export async function launchBotAndDashboard(options: LaunchBotOptions = {}): Promise<{
  bot: HelixBotClient;
  server: BotCallbackServer;
}> {
  const token = options.token || getBotToken();
  const port = options.port || getPort();
  const callbackUrl = options.callbackUrl || getCallbackUrl();

  console.log('====================================================');
  console.log('  🤖 HELIX Discord Bot & Web Dashboard Subsystem');
  console.log('====================================================\n');

  // Start the companion web dashboard and OAuth2 callback server
  const server = new BotCallbackServer({ callbackUrl, port });
  await server.start();

  const bot = new HelixBotClient();

  if (token) {
    try {
      await bot.start(token);
    } catch (err: any) {
      console.error(`❌ Discord Gateway connection error: ${err.message}`);
    }
  } else {
    console.log('⚠️  No DISCORD_BOT_TOKEN found in environment.');
    console.log('ℹ️  Web dashboard is running. Configure your bot token or visit the dashboard to setup.');
  }

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\nShutting down HELIX Discord Bot & Dashboard...');
    try {
      await bot.stop();
      await server.stop();
    } catch {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { bot, server };
}

// Auto-launch if executed directly (e.g., node bot/index.js or tsx bot/index.ts)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('bot/index.js') ||
  process.argv[1].endsWith('bot\\index.js') ||
  process.argv[1].endsWith('bot/index.ts') ||
  process.argv[1].endsWith('bot\\index.ts')
);

if (isDirectRun) {
  launchBotAndDashboard().catch((err) => {
    console.error('Fatal error starting bot subsystem:', err);
    process.exit(1);
  });
}
