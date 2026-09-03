import ora from 'ora';
import { deployBotCommands } from '../../../bot/index.js';
import { logger } from '../../utils/logger/index.js';

export async function deployBot(options: {
  token?: string;
  clientId?: string;
  guildId?: string;
  dryRun?: boolean;
}): Promise<void> {
  const token = options.token || process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || '';
  const clientId = options.clientId || process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || '';
  const guildId = options.guildId; // Explicit --guild-id flag only (scoped dev deployments)

  logger.title('Deploying Discord Bot Slash Commands');

  if (options.dryRun) {
    const res = await deployBotCommands({ token, clientId, guildId, dryRun: true });
    logger.success(res.message);
    return;
  }

  if (!token || !clientId) {
    logger.error('Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID.');
    logger.info('Set them in .env or pass via --token and --client-id');
    return;
  }

  const spinner = ora('Registering slash commands with Discord API...').start();
  const result = await deployBotCommands({ token, clientId, guildId, dryRun: false });

  if (result.success) {
    spinner.succeed(result.message);
  } else {
    spinner.fail(result.message);
  }
}
