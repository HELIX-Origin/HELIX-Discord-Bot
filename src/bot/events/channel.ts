import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import type { Channel } from 'discord.js';

function hasName(channel: Channel): channel is Channel & { name: string | null } {
  return 'name' in channel;
}

export async function handleChannelCreate(channel: Channel, bot: DiscordBot, _deps: AppDeps): Promise<void> {
  const logger = bot['logger'];
  if (hasName(channel)) {
    logger.debug('Channel created', { channelId: channel.id, name: channel.name, type: channel.type });
  } else {
    logger.debug('DM Channel created', { channelId: channel.id, type: channel.type });
  }
}

export async function handleChannelDelete(channelId: string, bot: DiscordBot, _deps: AppDeps): Promise<void> {
  const logger = bot['logger'];
  logger.debug('Channel deleted', { channelId });
}

export async function handleChannelUpdate(
  oldChannel: Channel,
  newChannel: Channel,
  bot: DiscordBot,
  _deps: AppDeps,
): Promise<void> {
  const logger = bot['logger'];
  if (hasName(newChannel)) {
    logger.debug('Channel updated', { channelId: newChannel.id, name: newChannel.name });
  } else {
    logger.debug('DM Channel updated', { channelId: newChannel.id });
  }
}
