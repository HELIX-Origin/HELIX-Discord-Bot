# 🔌 REST API Reference

The HELIX Discord Bot dashboard exposes a JSON REST API for managing feeds, presets, server settings, diagnostics, and triggering manual operations.

---

## 🔐 Authentication & Headers

Requests made through the web dashboard automatically pass the active Discord OAuth2 session cookie. For external API integrations or scripts, pass the session cookie or authorized token header:

```http
Content-Type: application/json
Accept: application/json
```

---

## 📡 Feeds Endpoints

### 1. List All Feeds
```http
GET /api/feeds
```
**Query Parameters**:
- `guildId` (optional): Filter feeds for a specific Discord server.
- `type` (optional): Filter by feed type (`rss`, `reddit`, `freegames`).

**Response**:
```json
[
  {
    "id": 1,
    "guildId": "123456789012345678",
    "channelId": "987654321098765432",
    "name": "Ars Technica",
    "url": "https://feeds.arstechnica.com/arstechnica/index",
    "feedType": "rss",
    "roleId": null,
    "color": "#FF5500",
    "enabled": true,
    "lastPolledAt": "2026-09-11T20:30:00Z",
    "createdAt": "2026-09-01T12:00:00Z"
  }
]
```

---

### 2. Create Feed Subscription
```http
POST /api/feeds
```
**Request Body**:
```json
{
  "guildId": "123456789012345678",
  "channelId": "987654321098765432",
  "name": "r/wallpapers",
  "url": "https://www.reddit.com/r/wallpapers/hot.rss",
  "feedType": "reddit",
  "roleId": "112233445566778899",
  "color": "#5865F2",
  "enabled": true
}
```
**Notes**: `roleId` (optional) is auto-subscribed to the feed's dedicated thread whenever thread delivery is enabled for the server (applied on thread creation/rotation). A short confirmation message (`📡 **name** configured — updates will be posted here.`) is posted into `channelId` after creation (best-effort).
**Response**: `201 Created` with created feed object.

---

### 3. Update Feed
```http
PATCH /api/feeds/:id
```
**Request Body**:
```json
{
  "name": "r/wallpapers (Pure Image)",
  "feedType": "reddit",
  "color": "#00FFCC",
  "enabled": true
}
```
**Response**: `200 OK` with updated feed object.

---

### 4. Delete Feed
```http
DELETE /api/feeds/:id
```
**Response**:
```json
{
  "success": true,
  "message": "Feed deleted successfully"
}
```

---

### 5. Manually Poll Single Feed
```http
POST /api/feeds/:id/poll
```
**Auth**: Guild Manager / Owner.
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Polled feed successfully",
  "feedId": 1
}
```

---

### 6. Manually Poll All Feeds
```http
POST /api/feeds/poll-all
Content-Type: application/json

{
  "guildId": "123456789012345678"
}
```
**Auth**: Guild Manager / Owner.
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Triggered poll for 5 feed(s)",
  "polledCount": 5
}
```

---

## 📚 News Feeds Presets Catalog

### 1. Fetch Verified Presets
```http
GET /api/presets
```
**Response**:
```json
{
  "categories": [
    "Technology",
    "Gaming",
    "AI",
    "Science",
    "Cybersecurity",
    "Hardware",
    "Linux",
    "Anime",
    "World News",
    "Space",
    "Entertainment",
    "Finance",
    "Development",
    "Design",
    "Crypto"
  ],
  "presets": [
    {
      "id": "tech-ars",
      "name": "Ars Technica",
      "url": "https://feeds.arstechnica.com/arstechnica/index",
      "category": "Technology",
      "description": "Original tech reporting, reviews, and analysis",
      "icon": "https://cdn.icon.url/ars.png"
    }
  ]
}
```

---

## 🏰 Guilds & Channels Endpoints

### 1. List User's Guilds
```http
GET /api/guilds
```
**Auth**: Any logged-in Discord user (relaxed — no role gate).
**Response**:
```json
{
  "botEnabled": true,
  "guilds": [
    {
      "id": "987654321098765432",
      "name": "My Server",
      "icon": "a_iconhash",
      "botIn": true,
      "canManage": true,
      "canInvite": true,
      "inviteUrl": "https://discord.com/oauth2/authorize?client_id=..."
    }
  ]
}
```

### 2. List Delivery Channels for a Guild
```http
GET /api/guilds/:guildId/channels
```
**Auth**: User must be able to manage the target guild.
**Response**:
```json
{
  "guildId": "987654321098765432",
  "name": "My Server",
  "icon": "a_iconhash",
  "canManage": true,
  "textChannels": [
    { "id": "987654321098765432", "name": "news-feed", "type": 0, "nsfw": false }
  ]
}
```

### 3. List Mentionable Roles for a Guild
```http
GET /api/guilds/:guildId/roles
```
**Response**:
```json
[
  {
    "id": "112233445566778899",
    "name": "Tech News Alerts",
    "color": "#00FFAA"
  }
]
```

### 4. Get Guild Settings
```http
GET /api/guilds/:guildId/settings
```
**Auth**: User must be able to manage the target guild.
**Response**:
```json
{
  "guildId": "987654321098765432",
  "name": "My Server",
  "icon": "a_iconhash",
  "roles": { "adminRoleId": null },
  "prefix": null,
  "features": { "welcome": true, "tickets": false, "logs": true },
  "welcome": { "enabled": false, "channelId": null },
  "tickets": { "channelId": null, "categoryId": null },
  "logs": {
    "auditLogChannelId": null,
    "auditLogEvents": ["guildBanAdd", "memberRoleUpdate", "channelCreate"],
    "modLogChannelId": null,
    "modLogEvents": ["warn", "kick", "ban"]
  },
  "commands": [],
  "guildRoles": [],
  "textChannels": [
    { "id": "987654321098765432", "name": "news-feed", "type": 0, "nsfw": false }
  ],
  "threadsEnabled": true
}
```

### 5. Update Guild Settings
```http
PUT /api/guilds/:guildId/settings
Content-Type: application/json
```
**Auth**: User must be able to manage the target guild.
**Accepted body fields**: `adminRoleId`, `prefix`, `features`, `ticketChannelId`/`ticketCategoryId` (or `ticketChannelId ""` to clear), `logs` fields, `welcome` fields, `commands`, and `threadsEnabled` (boolean — master thread-delivery toggle for the server).
**Example**:
```json
{
  "threadsEnabled": true
}
```
**Response**: `200 OK` with `{ "success": true, "changes": ["Thread delivery enabled"] }`.

### 6. Manually Poll All Guild Feeds & Alerts
```http
POST /api/guilds/:guildId/poll
```
**Auth**: User must have `Manage Channels` (or Administrator) on the target guild.
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Triggered poll for 8 feed(s) in server",
  "polledCount": 8
}
```

---

## 📊 Analytics & Diagnostics

### 1. System Statistics
```http
GET /api/stats
```
**Response**:
```json
{
  "totalFeeds": 42,
  "activeGuilds": 12,
  "totalArticlesDelivered": 15820,
  "uptimeSeconds": 864000,
  "memoryUsageMB": 85.4
}
```

### 2. Live Activity Logs
```http
GET /api/logs?limit=50
```
**Response**:
```json
[
  {
    "timestamp": "2026-09-11T20:38:12.100Z",
    "level": "info",
    "message": "Polled [Ars Technica] — 2 new items dispatched to channel 987654321098765432"
  }
]
```

---

## 🔧 Developer & Host Admin Endpoints

### 1. Force Poll All Feeds (Global)
```http
POST /api/admin/feeds/poll-all
```
**Auth**: Discord Bot Application Owner or Team Member.
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Triggered poll for 42 feed(s)",
  "polledCount": 42
}
```

