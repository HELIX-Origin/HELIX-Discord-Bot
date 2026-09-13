import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import { type Logger } from '../../util/logger.js';
import type { DiscordGuild, DiscordChannel, DiscordRole } from '../types.js';

export interface EventHandlers {
  onGuildCreate?: (guild: DiscordGuild, _bot: DiscordBot, _deps: AppDeps) => Promise<void>;
  onGuildDelete?: (guildId: string, _bot: DiscordBot, _deps: AppDeps) => Promise<void>;
  onChannelCreate?: (channel: DiscordChannel, _bot: DiscordBot, _deps: AppDeps) => Promise<void>;
  onChannelDelete?: (channelId: string, _bot: DiscordBot, _deps: AppDeps) => Promise<void>;
  onChannelUpdate?: (
    oldChannel: DiscordChannel,
    newChannel: DiscordChannel,
    _bot: DiscordBot,
    _deps: AppDeps,
  ) => Promise<void>;
  onRoleCreate?: (role: DiscordRole, _bot: DiscordBot, _deps: AppDeps) => Promise<void>;
  onRoleDelete?: (roleId: string, _bot: DiscordBot, _deps: AppDeps) => Promise<void>;
  onRoleUpdate?: (oldRole: DiscordRole, newRole: DiscordRole, _bot: DiscordBot, _deps: AppDeps) => Promise<void>;
  onVoiceStateUpdate?: (oldState: unknown, newState: unknown, _bot: DiscordBot, _deps: AppDeps) => Promise<void>;
  onReady?: (_bot: DiscordBot, _deps: AppDeps) => Promise<void>;
}

export function createDefaultEventHandlers(logger: Logger): EventHandlers {
  return {
    async onGuildCreate(guild, _bot, _deps) {
      logger.info('Bot joined guild', { guildId: guild.id, name: guild.name });
    },
    async onGuildDelete(guildId, _bot, deps) {
      logger.info('Bot removed from guild', { guildId });
      try {
        const result = deps.repo.deleteGuildData(guildId);
        logger.info('Cleaned up guild data', {
          guildId,
          feedsDeleted: result.feedsDeleted,
          guildsDeleted: result.guildsDeleted,
        });
      } catch (err) {
        logger.error('Failed to clean up guild data', { guildId, err: (err as Error).message });
      }
    },
    async onChannelDelete(channelId, _bot, _deps) {
      logger.debug('Channel deleted', { channelId });
    },
    async onRoleDelete(roleId, _bot, _deps) {
      logger.debug('Role deleted', { roleId });
    },
  };
}
