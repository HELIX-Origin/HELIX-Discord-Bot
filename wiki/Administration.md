# 🛡️ Guild Administration

HELIX Discord Bot includes a comprehensive administration system for server moderation, role management, and voice controls — all with Discord's native permission guards.

---

## ⚖️ Moderation Commands

| Command | Options | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `/admin warn` | `user: <user>`, `reason: <string>` | `Moderate Members` | Issue a warning to a member (logged to mod log channel if configured). |
| `/admin kick` | `user: <user>`, `reason: <string>` | `Kick Members` | Kick a member from the server. |
| `/admin ban` | `user: <user>`, `reason: <string>` | `Ban Members` | Ban a member (with optional message deletion). |
| `/admin lock` | `channel: <channel?>` | `Manage Channels` | Lock a channel (deny `Send Messages` for `@everyone`). |
| `/admin unlock` | `channel: <channel?>` | `Manage Channels` | Unlock a previously locked channel. |
| `/admin purge` | `count: <number>` (1–100), `channel: <channel?>` | `Manage Messages` | Bulk delete messages in a channel. |
| `/admin slowmode` | `seconds: <number>` (0–21600), `channel: <channel?>` | `Manage Channels` | Set slowmode delay on a channel. |
| `/admin announce` | `channel: <channel>`, `message: <string>` | `Manage Channels` | Send an announcement embed to a channel. |

> All moderation actions are logged to the configured mod log channel (set via `/set mod-log-channel` or dashboard).

---

## 👥 Role Management

| Command | Options | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `/admin role add` | `user: <user>`, `role: <role>` | `Manage Roles` | Assign a role to a member. |
| `/admin role remove` | `user: <user>`, `role: <role>` | `Manage Roles` | Remove a role from a member. |
| `/admin role list` | `user: <user?>` | `Manage Roles` | List roles for a member (or all assignable roles). |

> Role hierarchy is enforced — you cannot assign/remove roles higher than your own highest role.

---

## 🔊 Voice Controls

| Command | Options | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `/admin voice mute` | `user: <user>`, `reason: <string?>` | `Mute Members` | Server-mute a member in their current voice channel. |
| `/admin voice unmute` | `user: <user>` | `Mute Members` | Server-unmute a member. |
| `/admin voice deafen` | `user: <user>`, `reason: <string?>` | `Deafen Members` | Server-deafen a member. |
| `/admin voice undeafen` | `user: <user>` | `Deafen Members` | Server-undeafen a member. |
| `/admin voice move` | `user: <user>`, `channel: <voice channel>` | `Move Members` | Move a member to another voice channel. |
| `/admin voice disconnect` | `user: <user>`, `reason: <string?>` | `Move Members` | Disconnect a member from voice. |

---

## 🔐 Permission System

All administration commands respect Discord's native permission system:

1. **Command-level**: Each command declares its required permission(s) in the Discord command registration.
2. **Runtime check**: Before execution, the bot verifies the invoking member has the required permission(s) in the target channel/guild.
3. **Hierarchy enforcement**: For role/member actions, the bot enforces role hierarchy (cannot act on members with equal/higher top role).
4. **Bot permissions**: The bot itself must have the necessary permissions to perform the action (e.g., `Ban Members` to ban).

### Required Bot Permissions for Admin Features

| Permission | Purpose |
| :--- | :--- |
| `Kick Members` | `/admin kick` |
| `Ban Members` | `/admin ban` |
| `Moderate Members` | `/admin warn`, timeout (future) |
| `Manage Channels` | `/admin lock`, `/admin unlock`, `/admin slowmode`, `/admin announce` |
| `Manage Messages` | `/admin purge` |
| `Manage Roles` | `/admin role` |
| `Mute Members` | `/admin voice mute/unmute` |
| `Deafen Members` | `/admin voice deafen/undeafen` |
| `Move Members` | `/admin voice move/disconnect` |
| `View Channel` | All channel-targeted commands |
| `Send Messages` | All response embeds |
| `Embed Links` | Rich embed responses |

---

## 📋 Configuration

Administration commands are gated by the `ADMINISTRATION_ENABLED` feature flag (default: `true`).

```env
# Disable all admin commands
ADMINISTRATION_ENABLED=false
```

### Mod Log Channel
Set a dedicated channel for moderation action logs:

**Via Slash Command**:
```
/set mod-log-channel #mod-logs
```

**Via Dashboard**: Guild Settings → Mod Log Channel dropdown.

When configured, all warn/kick/ban/purge/lock/unlock/slowmode actions post an embed to this channel with:
- Action type
- Moderator
- Target user
- Reason
- Timestamp
- Case number (auto-incrementing)

---

## 🖥️ Dashboard Admin Page

The web dashboard includes a **Guild Administration** page (enabled when `ADMINISTRATION_ENABLED=true` and `ADMIN_PANEL_ENABLED=true`):

- **Moderation Panel**: Quick-access buttons for warn/kick/ban/purge/lock/slowmode/announce.
- **Role Manager**: Visual role list with add/remove buttons per member.
- **Voice Panel**: Current voice channel members with mute/deafen/move/disconnect controls.
- **Mod Log Viewer**: Paginated view of recent moderation actions.
- **Permission Check**: Shows which admin permissions the bot has in the current guild.

---

## 🛠️ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| "Missing Permissions" error | Ensure bot has the required permission AND role hierarchy allows the action. |
| "Cannot ban/kick user" | Target user has higher/equal top role than bot or moderator. |
| "Mod log not posting" | Verify `mod-log-channel` is set and bot has `Send Messages`/`Embed Links` there. |
| "Commands not showing" | Ensure `ADMINISTRATION_ENABLED=true` in `.env` and re-invite bot. |
| "Voice commands fail" | Bot must be in a voice channel and have `Mute Members`/`Deafen Members`/`Move Members`. |

---

## 🔗 Related

- [Discord Bot & Commands](Discord-Bot.md) — Full command reference table
- [Configuration → Feature Flags](Configuration.md) — `ADMINISTRATION_ENABLED`, `ADMIN_PANEL_ENABLED`
- [Integrations & Security → RBAC](Integrations-and-Security.md) — Permission model details