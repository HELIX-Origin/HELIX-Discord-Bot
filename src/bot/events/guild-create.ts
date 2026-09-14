import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import type { Guild } from 'discord.js';

export async function handleGuildCreate(guild: Guild, bot: DiscordBot, _deps: AppDeps): Promise<void> {
  const logger = bot['logger'];
  logger.info('Bot joined guild', { guildId: guild.id, name: guild.name });
}
