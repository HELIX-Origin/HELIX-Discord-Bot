/**
 * tests/unit/admin/permissions.test.ts
 *
 * Unit tests for hasPermission() and canManageMember().
 * Uses the makeMember() factory from tests/helpers/member.ts.
 * No Discord gateway or network access required.
 */
import { describe, it, expect } from 'vitest';
import { PermissionFlagsBits } from 'discord.js';
import { hasPermission, canManageMember } from '../../../src/bot/lib/admin/permissions.js';
import { makeMember } from '../../helpers/member.js';

// ── hasPermission() ───────────────────────────────────────────────────────────

describe('hasPermission()', () => {
  // Null / undefined guards
  it('returns false for null member', () => {
    expect(hasPermission(null, PermissionFlagsBits.KickMembers)).toBe(false);
  });

  it('returns false for undefined member', () => {
    expect(hasPermission(undefined, PermissionFlagsBits.KickMembers)).toBe(false);
  });

  // Exact permission match
  it('returns true when member holds the exact requested permission', () => {
    const member = makeMember({ permissions: [PermissionFlagsBits.KickMembers] });
    expect(hasPermission(member, PermissionFlagsBits.KickMembers)).toBe(true);
  });

  it('returns false when member lacks the requested permission', () => {
    const member = makeMember({ permissions: [] });
    expect(hasPermission(member, PermissionFlagsBits.KickMembers)).toBe(false);
  });

  it('returns false when member holds a different permission', () => {
    const member = makeMember({ permissions: [PermissionFlagsBits.KickMembers] });
    expect(hasPermission(member, PermissionFlagsBits.BanMembers)).toBe(false);
  });

  // Administrator bypass
  it('returns true for any permission when member has Administrator', () => {
    const admin = makeMember({ permissions: [PermissionFlagsBits.Administrator] });
    const flags: bigint[] = [
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
    ];
    for (const flag of flags) {
      expect(hasPermission(admin, flag)).toBe(true);
    }
  });

  // Individual permission checks
  it('correctly checks ManageGuild', () => {
    const member = makeMember({ permissions: [PermissionFlagsBits.ManageGuild] });
    expect(hasPermission(member, PermissionFlagsBits.ManageGuild)).toBe(true);
    expect(hasPermission(member, PermissionFlagsBits.KickMembers)).toBe(false);
  });

  it('correctly checks ManageMessages', () => {
    const member = makeMember({ permissions: [PermissionFlagsBits.ManageMessages] });
    expect(hasPermission(member, PermissionFlagsBits.ManageMessages)).toBe(true);
  });

  it('correctly checks ManageRoles', () => {
    const member = makeMember({ permissions: [PermissionFlagsBits.ManageRoles] });
    expect(hasPermission(member, PermissionFlagsBits.ManageRoles)).toBe(true);
  });

  it('correctly checks ModerateMembers (timeout)', () => {
    const member = makeMember({ permissions: [PermissionFlagsBits.ModerateMembers] });
    expect(hasPermission(member, PermissionFlagsBits.ModerateMembers)).toBe(true);
  });

  it('correctly checks ManageChannels', () => {
    const member = makeMember({ permissions: [PermissionFlagsBits.ManageChannels] });
    expect(hasPermission(member, PermissionFlagsBits.ManageChannels)).toBe(true);
  });
});

// ── canManageMember() ─────────────────────────────────────────────────────────

describe('canManageMember()', () => {
  // Null / undefined guards
  it('returns false when actor is null', () => {
    const target = makeMember({ id: 'target' });
    expect(canManageMember(null, target)).toBe(false);
  });

  it('returns false when target is null', () => {
    const actor = makeMember({ id: 'actor' });
    expect(canManageMember(actor, null)).toBe(false);
  });

  it('returns false when both are null', () => {
    expect(canManageMember(null, null)).toBe(false);
  });

  it('returns false when actor is undefined', () => {
    const target = makeMember({ id: 'target' });
    expect(canManageMember(undefined, target)).toBe(false);
  });

  // Guild owner special cases
  it('returns true when actor is the guild owner regardless of role position', () => {
    // Owner has role position 1, target has position 10
    const owner = makeMember({ id: 'owner-id', isOwner: true, highestRolePosition: 1 });
    const target = makeMember({ id: 'target-id', highestRolePosition: 10 });
    expect(canManageMember(owner, target)).toBe(true);
  });

  it('returns false when target is the guild owner', () => {
    // canManageMember checks: if (target.id === actor.guild.ownerId) return false;
    // So the actor's guild.ownerId must point to the target's id.
    const OWNER_ID = 'owner-id';
    const actor = makeMember({ id: 'actor-id', ownerId: OWNER_ID, highestRolePosition: 10 });
    const owner = makeMember({ id: OWNER_ID, isOwner: true, highestRolePosition: 1 });
    expect(canManageMember(actor, owner)).toBe(false);
  });

  // Role hierarchy
  it('returns true when actor role position > target role position', () => {
    const actor = makeMember({ id: 'actor', highestRolePosition: 10 });
    const target = makeMember({ id: 'target', highestRolePosition: 5 });
    expect(canManageMember(actor, target)).toBe(true);
  });

  it('returns false when actor role position === target role position', () => {
    const actor = makeMember({ id: 'actor', highestRolePosition: 5 });
    const target = makeMember({ id: 'target', highestRolePosition: 5 });
    expect(canManageMember(actor, target)).toBe(false);
  });

  it('returns false when actor role position < target role position', () => {
    const actor = makeMember({ id: 'actor', highestRolePosition: 3 });
    const target = makeMember({ id: 'target', highestRolePosition: 8 });
    expect(canManageMember(actor, target)).toBe(false);
  });

  // Self-management
  it('returns false when a non-owner actor tries to manage themselves', () => {
    // Same role position — hierarchy is equal → false
    const actor = makeMember({ id: 'self', highestRolePosition: 5 });
    const self = makeMember({ id: 'self', highestRolePosition: 5 });
    expect(canManageMember(actor, self)).toBe(false);
  });

  // Edge: very large role positions
  it('handles very large role position values correctly', () => {
    const actor = makeMember({ highestRolePosition: 999 });
    const target = makeMember({ highestRolePosition: 998 });
    expect(canManageMember(actor, target)).toBe(true);
  });

  // Edge: role position 0
  it('handles zero role position (everyone role)', () => {
    const actor = makeMember({ highestRolePosition: 1 });
    const target = makeMember({ highestRolePosition: 0 });
    expect(canManageMember(actor, target)).toBe(true);
  });
});
