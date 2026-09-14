import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import type { Role } from 'discord.js';

export async function handleRoleCreate(role: Role, bot: DiscordBot, _deps: AppDeps): Promise<void> {
  const logger = bot['logger'];
  logger.debug('Role created', { roleId: role.id, name: role.name });
}

export async function handleRoleDelete(roleId: string, bot: DiscordBot, _deps: AppDeps): Promise<void> {
  const logger = bot['logger'];
  logger.debug('Role deleted', { roleId });
}

export async function handleRoleUpdate(oldRole: Role, newRole: Role, bot: DiscordBot, _deps: AppDeps): Promise<void> {
  const logger = bot['logger'];
  logger.debug('Role updated', { roleId: newRole.id, name: newRole.name });
}
