import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';

export async function handleReady(bot: DiscordBot, _deps: AppDeps): Promise<void> {
  const logger = bot['logger'];
  logger.info('Discord client ready', { user: bot.getAppName() });
  await bot.detectApplicationOwners();
}
