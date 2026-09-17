# Skill: Guild Administration & Moderation Architecture

## Overview
This skill outlines the guild administration and moderation subsystem in **HELIX Discord Bot**, detailing slash commands, permission checks, role hierarchy enforcement, and mod logging.

---

## 1. Command Categories & Permissions

All administration commands enforce Discord native permissions via `interaction.member` permissions and role hierarchy checks:

| Domain | Commands | Required Permission |
|---|---|---|
| **Moderation** | `/admin warn`, `/admin kick`, `/admin ban` | `KickMembers` / `BanMembers` |
| **Channel Control** | `/admin lock`, `/admin unlock`, `/admin purge`, `/admin slowmode` | `ManageChannels` / `ManageMessages` |
| **Role Management** | `/admin role add`, `/admin role remove`, `/admin role list` | `ManageRoles` |
| **Voice Moderation** | `/admin voice mute`, `unmute`, `deafen`, `undeafen`, `move`, `disconnect` | `MuteMembers` / `DeafenMembers` / `MoveMembers` |
| **Broadcast** | `/admin announce` | `ManageGuild` or `Administrator` |

---

## 2. Invariants & Safety Guardrails

1. **Role Hierarchy Enforcement**:
   - The bot CANNOT moderate or modify roles for users with roles higher than or equal to the bot's highest role.
   - A moderator CANNOT target a member with a role higher than or equal to the moderator's highest role.

2. **Audit Logging & Case Records**:
   - Every moderation action generates a mod log entry sent to the configured `mod_log_channel_id`.
   - Mod log embeds include: case number, target user, moderator, reason, timestamp, and action color.

3. **Modular Option Definitions**:
   - Subcommand options reside in `src/bot/lib/options/admin.ts` and `src/bot/lib/options/set.ts`.
   - Actions and choices are strictly clamped to max 25 choices per option.
