import { PermissionFlagsBits, type GuildMember } from 'discord.js';

export function hasPermission(member: GuildMember | null | undefined, permission: bigint): boolean {
  if (!member) return false;
  return member.permissions.has(permission) || member.permissions.has(PermissionFlagsBits.Administrator);
}

export function canManageMember(
  actor: GuildMember | null | undefined,
  target: GuildMember | null | undefined,
): boolean {
  if (!actor || !target) return false;
  if (actor.id === actor.guild.ownerId) return true;
  if (target.id === actor.guild.ownerId) return false;
  return actor.roles.highest.position > target.roles.highest.position;
}
