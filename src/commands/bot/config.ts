import path from 'path';
import pc from 'picocolors';
import { saveEnvValue, getEnvPaths } from '../../utils/env/index.js';
import { logger } from '../../utils/logger/index.js';

export function configureBotEnv(options: {
  token?: string;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
  envPath?: string;
}): void {
  const targetEnv = options.envPath || path.resolve(process.cwd(), '.env');
  logger.title('Configure Discord Bot in .env');

  let updatedCount = 0;

  if (options.token) {
    saveEnvValue('DISCORD_BOT_TOKEN', options.token, targetEnv);
    logger.success(`Saved DISCORD_BOT_TOKEN to ${pc.bold(targetEnv)}`);
    updatedCount++;
  }

  if (options.clientId) {
    saveEnvValue('DISCORD_CLIENT_ID', options.clientId, targetEnv);
    logger.success(`Saved DISCORD_CLIENT_ID to ${pc.bold(targetEnv)}`);
    updatedCount++;
  }

  if (options.clientSecret) {
    saveEnvValue('DISCORD_CLIENT_SECRET', options.clientSecret, targetEnv);
    logger.success(`Saved DISCORD_CLIENT_SECRET to ${pc.bold(targetEnv)}`);
    updatedCount++;
  }

  if (options.callbackUrl) {
    saveEnvValue('DISCORD_CALLBACK_URL', options.callbackUrl, targetEnv);
    logger.success(`Saved DISCORD_CALLBACK_URL to ${pc.bold(targetEnv)}`);
    updatedCount++;
  }

  if (updatedCount === 0) {
    logger.info('No configuration values provided to save.');
    console.log('\nUsage example:');
    console.log(pc.cyan('  helix bot config --token <your_bot_token> --client-id <your_client_id>\n'));
    console.log('You can also edit your .env file directly:');
    console.log(pc.dim('  DISCORD_BOT_TOKEN=...'));
    console.log(pc.dim('  DISCORD_CLIENT_ID=...'));
    console.log(pc.dim('  DISCORD_CALLBACK_URL=http://localhost:5000\n'));
  }
}
