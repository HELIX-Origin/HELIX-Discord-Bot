# 🛡️ Guild Administration

HELIX Discord Bot includes a comprehensive administration system for server moderation, role management, and voice controls — all with Discord's native permission guards.

---

## ⚖️ Moderation Commands

| Command | Options | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `/warn` | `user: <user>`, `reason: <string>` | `Moderate Members` | Issue a warning to a member (logged to mod log channel if configured). |
| `/kick` | `user: <user>`, `reason: <string?>` | `Kick Members` | Kick a member from the server. |
| `/ban` | `user: <user>`, `delete_days: <number?>`, `reason: <string?>` | `Ban Members` | Ban a member (with optional message deletion). |
| `/lock` | `channel: <channel?>`, `reason: <string?>` | `Manage Channels` | Lock a channel (deny `Send Messages` for `@everyone`). |
| `/unlock` | `channel: <channel?>` | `Manage Channels` | Unlock a previously locked channel. |
| `/purge` | `count: <number>` (1–100) | `Manage Messages` | Bulk delete messages in a channel. |
| `/slowmode` | `seconds: <number>` (0–21600), `channel: <channel?>` | `Manage Channels` | Set slowmode delay on a channel. |
| `/announce` | `channel: <channel>`, `message: <string>`, `title: <string?>` | `Manage Channels` | Send an announcement embed to a channel. |

> All moderation actions are logged to the configured mod log channel (set via `/set mod-log-channel` or dashboard).

---

## 👥 Role Management

| Command | Options | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `/role add` | `user: <user>`, `role: <role>` | `Manage Roles` | Assign a role to a member. |
| `/role remove` | `user: <user>`, `role: <role>` | `Manage Roles` | Remove a role from a member. |
| `/role list` | `user: <user?>` | `Manage Roles` | List roles for a member (or all assignable roles). |

> Role hierarchy is enforced — you cannot assign/remove roles higher than your own highest role.

---

## 🔊 Voice Controls

| Command | Options | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `/voice mute` | `user: <user>`, `reason: <string?>` | `Mute Members` | Server-mute a member in their current voice channel. |
| `/voice unmute` | `user: <user>` | `Mute Members` | Server-unmute a member. |
| `/voice deafen` | `user: <user>`, `reason: <string?>` | `Deafen Members` | Server-deafen a member. |
| `/voice undeafen` | `user: <user>` | `Deafen Members` | Server-undeafen a member. |
| `/voice move` | `user: <user>`, `channel: <voice channel>` | `Move Members` | Move a member to another voice channel. |
| `/voice disconnect` | `user: <user>`, `reason: <string?>` | `Move Members` | Disconnect a member from voice. |

---

## 👋 Welcome Message System

HELIX Discord Bot provides a fully customizable welcome announcement system triggered automatically when a new member joins the server.

### Commands & Options
| Command | Options | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `/welcome` | `action: setup\|channel\|message\|view\|test\|disable`, `channel: <channel?>`, `content: <string?>`, `embed: <bool?>`, `color: <string?>`, `thumbnail: <bool?>`, `banner: <string?>` | `Manage Guild` | Configure and test the welcome announcement system. |

### Dynamic Placeholders
Welcome messages support the following dynamic variables in both plain text and embed descriptions:
- `{user}` — Username of the member who joined (e.g. `NewMember`).
- `{mention}` — Interactive user mention ping (e.g. `@NewMember`).
- `{server}` — Name of the Discord server.
- `{membercount}` — Total server member count after the member joined.

### Format Modes
- **Plain Text**: Sends standard markdown text directly into the designated channel.
- **Rich Embed**: Renders a styled Discord embed card with custom accent color, user avatar thumbnail, and optional banner image.

### Dashboard Welcome Tab
Configurable under **General → Welcome Message** on the web dashboard:
- **Responsive 2-Column Grid**: Form configuration on the left, **Live Discord Preview** on the right.
- **Live Markdown & Placeholder Preview**: Changes to the message textarea instantly update the simulated Discord message showing resolved placeholders and formatting.

---

## 🎫 Support Ticket System

HELIX Discord Bot includes a native thread-based support ticket system. A sticky prompt message containing an interactive **[🎫 Open Ticket]** button is posted to your configured ticket channel. When a member clicks the button, the bot automatically creates a dedicated private thread and pings the support manager role.

### Commands & Options
| Command | Options | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `/ticket` | `action: setup\|disable\|view\|create\|close\|add\|remove\|claim\|transcript`, `channel: <channel?>`, `manager_role: <role?>`, `transcript_channel: <channel?>`, `log_channel: <channel?>`, `message: <string?>`, `embed: <bool?>`, `color: <string?>`, `reason: <string?>`, `user: <user?>` | `Manage Channels` | Configure, manage, and handle support tickets. |

### Workflow Architecture
1. **Host Message**: Bot posts the configured ticket prompt and `[🎫 Open Ticket]` button to the ticket channel. Supports both **Plain Text** and **Rich Embed** formats (`embed: true` or Format dropdown on dashboard).
2. **Ticket Creation**: Clicking the button creates a new thread in the channel (e.g. `ticket-username`) and adds the member.
3. **Manager Role Alert**: If a Support Manager role is configured, the bot mentions/adds the role to the thread for rapid staff response.
4. **Ticket Operations**: Staff and users can add members (`/ticket action:add`), close the ticket (`/ticket action:close`), or archive transcripts.

### Dashboard Tickets Tab
Configurable under **General → Support Tickets** on the web dashboard:
- **Responsive 2-Column Grid**: Channel & Role routing selectors, **Format dropdown** (`Plain text` / `Embed`), and prompt textarea on the left; **Live Button & Message Preview** on the right.
- **Live Interactive Button & Embed Preview**: Previews the prompt (plain text or rich embed card) and interactive blurple Discord ticket button before saving.

---

## ⚙️ Server Configuration Commands

| Command | Options | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `/set` | `action: mod-log\|welcome\|tickets\|prefix`, `channel: <channel?>`, `role: <role?>`, `value: <string?>` | `Administrator` | Set server-wide settings and channels. |
| `/server` | `action: export\|import\|command`, `command_name: <string?>`, `enabled: <bool?>` | `Administrator` | Export/import server settings or enable/disable specific bot commands. |

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

## 🖥️ Dedicated Dashboard Admin & Management Tabs

The web dashboard organizes server management into dedicated, permission-gated tabs (enabled when `ADMINISTRATION_ENABLED=true` and `DASHBOARD_ENABLED=true`):

- **Welcome Message Tab**: Dedicated 2-column layout with channel select, plain text vs embed toggle, message textarea, available placeholders reference, and live simulated Discord preview.
- **Support Tickets Tab**: Dedicated 2-column layout with ticket channel selector, support manager role dropdown, prompt message textarea, workflow guide, and live Discord button preview.
- **Audit & Mod Logs Tab**: Audit log channel selection, event subscriptions (`guildBanAdd`, `memberRoleUpdate`, etc.), and paginated log stream.
- **Guild Admin Tab**: Dedicated configuration for Administrator role, custom bot command prefix, feature flag toggles, per-server command enable/disable list, and thread delivery settings.

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

- [Discord Bot & Commands](Discord-Bot) — Full command reference table
- [Configuration → Feature Flags](Configuration) — `ADMINISTRATION_ENABLED`, `ADMIN_PANEL_ENABLED`
- [Integrations & Security → RBAC](Integrations-and-Security) — Permission model details