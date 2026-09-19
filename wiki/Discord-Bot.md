# 🤖 Discord Bot & Commands

HELIX Discord Bot operates as a Discord application adhering strictly to **discord.js v14** standards. It delivers notifications directly to channels or dedicated threads, eliminating the need to manage external webhooks.

---

## ⚡ Slash Commands Reference

All commands register through Discord's native interaction model and use ephemeral response flags where appropriate (e.g. errors), with owner/team detection for elevated bot features.

| Command | Subcommands / Options | Permissions Required | Description |
| :--- | :--- | :--- | :--- |
| `/rss` | `add`, `list`, `remove`, `toggle`, `poll` | `Manage Channels` | Manage RSS, Atom, and web scraper feeds, or trigger manual polling. |
| `/youtube` | `add`, `list`, `remove`, `toggle`, `check` | `Manage Channels` | Manage YouTube video and livestream alerts, or trigger manual checks. |
| `/twitch` | `add`, `list`, `remove`, `toggle`, `check` | `Manage Channels` | Manage Twitch livestream alerts, or trigger manual live checks. |
| `/free-games` | `enable`, `status`, `disable`, `check` | `Manage Channels` | Manage weekly free game notifications and trigger manual giveaway checks. |
| `/reddit` | `add`, `list`, `remove`, `toggle`, `poll` | `Manage Channels` | Manage Reddit subreddit image and news feeds, or trigger immediate checks. |
| `/warn` | `user: <user>`, `reason: <string>` | `Moderate Members` | Warn a member. |
| `/kick` | `user: <user>`, `reason: <string>` | `Kick Members` | Kick a member. |
| `/ban` | `user: <user>`, `reason: <string>` | `Ban Members` | Ban a member. |
| `/lock` | `channel: <channel?>` | `Manage Channels` | Lock a channel. |
| `/unlock` | `channel: <channel?>` | `Manage Channels` | Unlock a channel. |
| `/purge` | `count: <number>` | `Manage Messages` | Bulk delete messages. |
| `/slowmode` | `seconds: <number>`, `channel: <channel?>` | `Manage Channels` | Set slowmode. |
| `/announce` | `channel: <channel>`, `message: <string>` | `Manage Channels` | Send an announcement. |
| `/role` | `add`, `remove`, `list` | `Manage Roles` | Assign, remove, or list roles. |
| `/voice` | `mute`, `unmute`, `deafen`, `undeafen`, `move`, `disconnect` | `Mute/Deafen/Move Members` | Voice channel member management. |
| `/server` | `export`, `import`, `command` | `Administrator` | Guild configurations and per-server command toggles. |
| `/stats` | *None* | Everyone | Displays bot uptime, memory usage, and delivery analytics. |
| `/about` | `bot`, `user [@user]`, `guild` | Everyone | View bot, user, or guild information and stats. |
| `/help` | `command: <string?>` | Everyone | Interactive documentation browser with command usage tips. |

---

## 🔒 Required Discord Bot Permissions

When inviting the bot to your Discord server, ensure it is granted the following permissions in target channels:

| Permission Name | Flag | Purpose |
| :--- | :--- | :--- |
| **View Channel** | `ViewChannel` | Discover channel and read status |
| **Send Messages** | `SendMessages` | Post text notifications and role mentions |
| **Embed Links** | `EmbedLinks` | Render rich embed cards with thumbnails and links |
| **Attach Files** | `AttachFiles` | Upload images/banners when remote hotlinking is blocked |
| **Mention Everyone / Roles** | `MentionEveryone` | Ping configured notification roles (`@role`) |
| **Use External Emojis** | `UseExternalEmojis` | Display custom source platform icons |
| **Send Messages in Threads** | `SendMessagesInThreads` | Post feed entries inside feed threads |
| **Create Public Threads** | `CreatePublicThreads` | Open per-feed threads in the feed's delivery channel |
| **Manage Threads** | `ManageThreads` | Archive/rotate large feed threads, keepalive polling |

> The invite URLs rendered across the dashboard include these thread bits on top of the base permission set.

---

## 🧵 Thread Delivery (Optional)

Instead of delivering into a regular channel, a server can enable **thread delivery**: each feed subscription gets **its own dedicated thread**, auto-created in the feed's configured text channel (one thread per feed, named after the feed). The feature is entirely optional and **per server**:

- Enabled from the dashboard **Guild Admin tab → Feed Delivery** ("Enable Thread delivery" checkbox — any guild manager can configure it) or via `PUT /api/guilds/:guildId/settings` with `threadsEnabled`.
- The first feed entry becomes the thread's **first post**; subsequent entries land as messages inside the same thread.
- Threads are **kept open** by a keepalive pass that posts a tiny message whenever a thread is within ~24h of Discord's auto-archive. (Disabled with `THREAD_KEEPALIVE_ENABLED=false`.)
- When a thread reaches `THREAD_MAX_MESSAGES` (default `100`) entries, the large thread is **archived + locked** and a **fresh thread** opens automatically in its place.
- Feed threads are **public**; an optional **per-feed role** can be attached when adding a feed (`/rss add`, `/reddit add`, `/youtube add`, `/twitch add`, `/free-games enable`, or from the dashboard add/detail forms). That role is **auto-subscribed to the feed's dedicated thread** on creation/rotation, so members with the role can follow updates.
- Adding a feed into a channel posts a short confirmation message there: `📡 **feed** configured — updates will be posted here.` (best-effort; never surfaces as a command error).
- Servers without thread delivery enabled behave exactly as before (direct channel delivery).

See [Configuration → Thread Delivery](Configuration.md) for the full variable reference.

---

## 🎨 Rich Embed Formatting & Customization

Notifications are styled using Discord rich embeds:

```
┌───────────────────────────────────────────────────────────┐
│ [RSS] The Verge                                           │
│ ───────────────────────────────────────────────────────── │
│ Introducing Gemini 2.0 & Autonomous Coding Agents         │
│                                                           │
│ Discover how modern foundation models empower developer   │
│ workflows with agentic code generation and testing...     │
│                                                           │
│ Published: Sep 11, 2026 •  Author: Example Author         │
│ ───────────────────────────────────────────────────────── │
│  Read Article (https://example.com/...)                   │
│ [ High-Resolution Video Poster Thumbnail Banner ]         │
└───────────────────────────────────────────────────────────┘
```

- **Custom Colors**: Each feed can specify a unique hex color (e.g. `#f59e0b` for RSS feeds, `#FF4500` for Reddit, `#0078F2` for Epic Games).
- **Author Branding**: Source platforms and storefronts display their high-resolution official branding icons.
- **Smart Truncation**: Descriptions exceeding Discord embed character limits (4,096 chars for description, 256 for title) are cleanly truncated at word boundaries with ellipsis (`...`).
- **Role Mentions**: Configured role mentions are prepended to the message payload, triggering push notifications for subscribed server members.
