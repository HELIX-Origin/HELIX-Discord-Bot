import ora from 'ora';
import { HelixBotClient, BotCallbackServer } from '../../../bot/index.js';
import { logger } from '../../utils/logger/index.js';
import { showBanner } from '../../utils/banner/index.js';

export async function startBot(options: { token?: string; callbackUrl?: string } = {}): Promise<void> {
  const token = options.token || process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;

  showBanner();
  logger.title('Starting Built-in HELIX Discord Bot');

  // Start the local OAuth2 callback server on port 5000 / configured URL
  const callbackServer = new BotCallbackServer({ callbackUrl: options.callbackUrl });
  await callbackServer.start();

  if (!token) {
    logger.error('No bot token provided.');
    logger.info('Please set DISCORD_BOT_TOKEN in .env or pass --token <token>');
    logger.info('Callback server is active for authorization handling. Press Ctrl+C to stop.');

    process.on('SIGINT', async () => {
      logger.info('\nShutting down callback server...');
      await callbackServer.stop();
      process.exit(0);
    });
    return;
  }

  const spinner = ora('Connecting to Discord Gateway...').start();
  const bot = new HelixBotClient();

  try {
    await bot.start(token);
    spinner.stop();

    logger.info('Press Ctrl+C to terminate the bot process.');

    process.on('SIGINT', async () => {
      logger.info('\nShutting down bot and callback server gracefully...');
      await bot.stop();
      await callbackServer.stop();
      process.exit(0);
    });
  } catch (err: any) {
    spinner.fail(`Failed to start Discord Bot: ${err.message}`);
    await callbackServer.stop();
  }
}
