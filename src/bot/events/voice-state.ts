import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import type { VoiceState } from 'discord.js';

export async function handleVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState,
  bot: DiscordBot,
  deps: AppDeps,
): Promise<void> {
  const logger = bot['logger'];
  logger.debug('Voice state updated', { oldState, newState });

  const manager = deps.lavaManager;
  if (!manager) return;

  // Lavalink expects the raw voice state payload:
  // { guildId, channelId (nullable), sessionId, selfDeaf, selfMute }
  manager.handleVoiceStateUpdate({
    guildId: newState.guild.id,
    channelId: newState.channelId,
    sessionId: newState.sessionId ?? null,
    selfDeaf: newState.selfDeaf,
    selfMute: newState.selfMute,
  });
}
