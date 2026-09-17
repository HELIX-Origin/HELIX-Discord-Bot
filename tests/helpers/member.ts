/**
 * tests/helpers/member.ts
 *
 * Minimal GuildMember mock factory for permission tests.
 * Avoids importing discord.js internals — only the public interface is used.
 */
import { PermissionFlagsBits } from 'discord.js';
import type { GuildMember } from 'discord.js';

export interface MockMemberOptions {
  /** Member's Discord user ID. */
  id?: string;
  /** Whether this member IS the guild owner. When true, ownerId === id. */
  isOwner?: boolean;
  /** ID of the guild owner (used when isOwner=false). */
  ownerId?: string;
  /** Permissions held by this member (Administrator automatically bypasses checks). */
  permissions?: bigint[];
  /** Highest role position — used for hierarchy comparisons. */
  highestRolePosition?: number;
}

/**
 * Creates a minimal GuildMember-shaped object for unit testing permission
 * helpers without a live Discord gateway connection.
 */
export function makeMember(opts: MockMemberOptions = {}): GuildMember {
  const {
    id = 'user-100',
    isOwner = false,
    ownerId = 'owner-000',
    permissions = [],
    highestRolePosition = 1,
  } = opts;

  const permSet = new Set(permissions);

  return {
    id,
    guild: {
      ownerId: isOwner ? id : ownerId,
    },
    permissions: {
      has(flag: bigint): boolean {
        return permSet.has(flag) || permSet.has(PermissionFlagsBits.Administrator);
      },
    },
    roles: {
      highest: { position: highestRolePosition },
    },
  } as unknown as GuildMember;
}
