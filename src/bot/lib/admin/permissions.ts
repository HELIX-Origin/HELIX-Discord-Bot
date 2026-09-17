import { PermissionFlagsBits, type GuildMember } from 'discord.js';

export const ADMIN_PERMISSIONS = {
  ADMINISTRATOR: PermissionFlagsBits.Administrator,
  MANAGE_GUILD: PermissionFlagsBits.ManageGuild,
  MANAGE_CHANNELS: PermissionFlagsBits.ManageChannels,
  MANAGE_ROLES: PermissionFlagsBits.ManageRoles,
  MANAGE_MESSAGES: PermissionFlagsBits.ManageMessages,
  KICK_MEMBERS: PermissionFlagsBits.KickMembers,
  BAN_MEMBERS: PermissionFlagsBits.BanMembers,
  MODERATE_MEMBERS: PermissionFlagsBits.ModerateMembers,
  VIEW_AUDIT_LOG: PermissionFlagsBits.ViewAuditLog,
} as const;

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
