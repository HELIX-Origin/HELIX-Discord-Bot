import { showBotStatus } from './status.js';
import { deployBot } from './deploy.js';
import { startBot } from './start.js';
import { configureBotEnv } from './config.js';
import { runInteractiveBotSetup } from './setup.js';
import { startDashboardCommand } from './dashboard.js';
import { logger } from '../../utils/logger/index.js';

export async function botCommand(
  action: string = 'status',
  options: {
    token?: string;
    clientId?: string;
    clientSecret?: string;
    guildId?: string;
    callbackUrl?: string;
    envPath?: string;
    port?: number;
    dryRun?: boolean;
  } = {}
): Promise<void> {
  if (action === 'status') {
    showBotStatus();
  } else if (action === 'setup') {
    await runInteractiveBotSetup();
  } else if (action === 'dashboard') {
    await startDashboardCommand({ port: options.port, url: options.callbackUrl });
  } else if (action === 'config') {
    configureBotEnv(options);
  } else if (action === 'deploy') {
    await deployBot(options);
  } else if (action === 'start') {
    await startBot(options);
  } else {
    logger.error(`Unknown bot action: "${action}". Valid actions: status, setup, dashboard, config, deploy, start`);
  }
}

export * from './status.js';
export * from './setup.js';
export * from './dashboard.js';
export * from './config.js';
export * from './deploy.js';
export * from './start.js';
