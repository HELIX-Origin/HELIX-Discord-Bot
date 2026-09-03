import pc from 'picocolors';
import { BotCallbackServer, getNextAuthConfig } from '../../../bot/index.js';
import { logger } from '../../utils/logger/index.js';
import { showBanner } from '../../utils/banner/index.js';

export async function startDashboardCommand(options: { port?: number; url?: string } = {}): Promise<void> {
  showBanner();
  logger.title('Launching HELIX Discord Bot Web Dashboard');

  const config = getNextAuthConfig();
  const baseUrl = options.url || config.url || 'http://localhost:5000';
  const server = new BotCallbackServer({ callbackUrl: baseUrl, port: options.port });

  await server.start();

  console.log(`\n  ${pc.bold('Dashboard URLs:')}`);
  console.log(`  Public (NEXTAUTH_URL):          ${pc.cyan(config.url + '/dashboard')}`);
  console.log(`  Internal (NEXTAUTH_INTERNAL_URL): ${pc.cyan(config.internalUrl + '/dashboard')}`);
  console.log(`  NextAuth Signin Endpoint:       ${pc.cyan(config.url + '/api/auth/signin')}`);
  console.log(`\n  Press ${pc.bold('Ctrl+C')} to terminate the dashboard.\n`);

  process.on('SIGINT', async () => {
    logger.info('\nShutting down dashboard server...');
    await server.stop();
    process.exit(0);
  });
}

export default startDashboardCommand;
