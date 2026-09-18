import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import type { VoiceState } from 'discord.js';

export async function handleVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState,
  bot: DiscordBot,
  _deps: AppDeps,
): Promise<void> {
  const logger = bot['logger'];
  logger.debug('Voice state updated', { oldState, newState });
}
