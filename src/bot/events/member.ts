import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import { getWelcomeConfig, sendWelcomeMessage } from '../commands/admin/welcome.js';

export async function handleGuildMemberAdd(
  member: import('discord.js').GuildMember,
  bot: DiscordBot,
  deps: AppDeps,
): Promise<void> {
  const guildId = member.guild.id;
  const config = getWelcomeConfig(deps, guildId);
  if (!config.enabled || !config.channelId) return;

  const avatarUrl = member.user.avatarURL({ size: 128 });
  const sent = await sendWelcomeMessage(bot, config, {
    userId: member.user.id,
    displayName: member.displayName || member.user.username,
    server: member.guild.name,
    memberCount: member.guild.memberCount,
    avatarUrl,
  });

  if (!sent) {
    const logger = bot['logger'];
    logger.warn('Failed to send welcome message', { guildId, channelId: config.channelId });
  }
}
