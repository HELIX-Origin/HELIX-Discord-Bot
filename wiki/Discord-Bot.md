# 🤖 Discord Bot & Commands

HELIX Discord Bot operates as a Discord application adhering strictly to **discord.js v14** standards. It delivers notifications directly to channels or dedicated forum threads, eliminating the need to manage external webhooks.

---

## ⚡ Slash Commands Reference

All commands register through Discord's native interaction model and use ephemeral response flags where appropriate (e.g. errors), with owner/team detection for elevated bot features.

| Command | Subcommands / Options | Permissions Required | Description |
| :--- | :--- | :--- | :--- |
| `/rss` | `add`, `list`, `remove`, `toggle` | `Manage Channels` | Manage RSS, Atom, and web scraper feeds. |
| `/youtube` | `add`, `list`, `remove`, `toggle` | `Manage Channels` | Manage YouTube video and livestream alerts. |
| `/twitch` | `add`, `list`, `remove`, `toggle` | `Manage Channels` | Manage Twitch livestream alerts. |
| `/free-games` | `enable`, `status`, `disable` | `Manage Channels` | Manage weekly free game notifications (Epic, Steam, GOG, etc.). |
| `/reddit` | `add`, `list`, `remove`, `toggle` | `Manage Channels` | Manage Reddit subreddit image and news feeds. |
| `/gif` | `category: <string?>` | Everyone | Get a random GIF (autocomplete: anime, jojo, waifu, slap, etc.). |
| `/slap` | `user: <user?>` | Everyone | Slap a user (or random GIF). |
| `/hug` | `user: <user?>` | Everyone | Hug a user. |
| `/kiss` | `user: <user?>` | Everyone | Kiss a user. |
| `/pat` | `user: <user?>` | Everyone | Pat a user. |
| `/bonk` | `user: <user?>` | Everyone | Bonk a user. |
| `/cuddle` | `user: <user?>` | Everyone | Cuddle a user. |
| `/tickle` | `user: <user?>` | Everyone | Tickle a user. |
| `/pet` | `user: <user?>` | Everyone | Pet a user. |
| `/poke` | `user: <user?>` | Everyone | Poke a user. |
| `/baka` | `user: <user?>` | Everyone | Baka a user. |
| `/smug` | `user: <user?>` | Everyone | Smug reaction. |
| `/cry` | `user: <user?>` | Everyone | Cry reaction. |
| `/angry` | `user: <user?>` | Everyone | Angry reaction. |
| `/meme` | *None* | Everyone | Random meme GIF. |
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
| **Create Public Threads** | `CreatePublicThreads` | Open per-feed threads inside forum channels |
| **Manage Threads** | `ManageThreads` | Archive/rotate large feed threads, keepalive polling |

> The invite URLs rendered across the dashboard include these thread bits on top of the base permission set.

---

## 🧵 Forum Thread Delivery (Optional)

Instead of delivering into a regular channel, a server can opt each feed subscription into **its own dedicated thread inside a forum channel** (one thread per feed, named after the feed). The feature is entirely optional and **per server**:

- Enabled from the dashboard **Feeds tab** (per-server "Forum Thread Delivery" card — any guild manager can configure it) or via the global `FORUM_CHANNEL_IDS` env default.
- The first feed entry becomes the thread's **opening post**; subsequent entries land as messages inside the same thread.
- Threads are **kept open** by a keepalive pass that posts a tiny message whenever a thread is within ~24h of Discord's auto-archive. (Disabled with `THREAD_KEEPALIVE_ENABLED=false`.)
- When a thread reaches `THREAD_MAX_MESSAGES` (default `100`) entries, the large thread is **archived + locked** and a **fresh thread** opens automatically in its place.
- Servers without thread delivery enabled behave exactly as before (direct channel delivery).

See [Configuration → Forum Thread Delivery](Configuration.md) for the full variable reference.

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
