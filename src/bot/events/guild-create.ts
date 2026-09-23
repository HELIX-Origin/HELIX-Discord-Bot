import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import type { Guild } from 'discord.js';

export async function handleGuildCreate(guild: Guild, bot: DiscordBot, deps: AppDeps): Promise<void> {
  const logger = bot['logger'];
  logger.info('Bot joined guild', { guildId: guild.id, name: guild.name });
  try {
    const existing = deps.repo.getGuildBinding(guild.id);
    if (!existing || !existing.name || existing.name !== guild.name) {
      deps.repo.bindGuild(guild.id, existing?.userId ?? 0, guild.name);
    }
  } catch (err) {
    logger.debug('Failed to sync guild name on GuildCreate', { guildId: guild.id, err: (err as Error).message });
  }
  void bot.syncGuildCommands(guild.id);
}
