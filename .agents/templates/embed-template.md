# 🎨 Discord Embed Template & Standards (`EmbedHandler`)

Standard Embed Handler template, formatting guide, and production blueprints for **HELIX Discord Bot**.

All Discord embeds across slash commands, event notifications, moderation logs, feed deliveries, and dashboard previews must be constructed using the centralized **`EmbedHandler`** fluent builder (`src/bot/lib/embeds/builder.ts`).

---

## 📑 Table of Contents
1. [Core Principles](#-core-principles)
2. [EmbedHandler Initialization](#-embedhandler-initialization)
3. [Variants & Semantic Color Palette](#-variants--semantic-color-palette)
4. [Limits & Character Budgeting](#-limits--character-budgeting)
5. [Builder API Reference](#-builder-api-reference)
6. [Domain Embed Patterns & Blueprints](#-domain-embed-patterns--blueprints)
   - [Pattern 1: Slash Command Success / Acknowledgment](#pattern-1-slash-command-success--acknowledgment)
   - [Pattern 2: Ephemeral Error / Permission Rejection](#pattern-2-ephemeral-error--permission-rejection)
   - [Pattern 3: Moderation Action Log Case](#pattern-3-moderation-action-log-case)
   - [Pattern 4: Feed / Alert Syndication Delivery](#pattern-4-feed--alert-syndication-delivery)
   - [Pattern 5: Detailed Information / Statistics Card](#pattern-5-detailed-information--statistics-card)
7. [Design Do's and Don'ts](#-design-dos-and-donts)

---

## 🎯 Core Principles

1. **Automatic Bot Branding**: Embeds created via `EmbedHandler.for(deps)` automatically inherit the runtime application display name, avatar icon, and branded footer without hardcoded strings.
2. **Zero Truncation Exceptions**: `clampText()` automatically handles string truncation at clean word boundaries with ellipsis (`…`), guaranteeing that Discord's 400 Bad Request error limits (50035) are never violated.
3. **Semantic Color & Status Consistency**: Consistent visual cues (success green, error red, warning amber, info blue, primary cyan) are enforced across every server and command.
4. **Clean Markdown Structure**: Codeblocks, inline code, bold labels, and bulleted lists must follow standardized layouts to render legibly on desktop, tablet, and mobile Discord clients.

---

## 🚀 EmbedHandler Initialization

Always instantiate `EmbedHandler` using the factory method with `AppDeps`:

```typescript
import { EmbedHandler, EPHEMERAL } from '../../lib/embeds/builder.js';
import type { AppDeps } from '../../../app.js';

// In command execution handler:
export async function execute(interaction: DiscordInteraction, deps: AppDeps) {
  const handler = EmbedHandler.for(deps);

  // Return interaction response
  return handler
    .success()
    .title('Operation Complete')
    .description('The requested operation was performed successfully.')
    .respond();
}
```

If `AppDeps` is unavailable (e.g. in test helpers or isolated utilities), use the direct constructor:
```typescript
import { EmbedHandler } from '../../lib/embeds/builder.js';

const handler = new EmbedHandler(); // Unbranded fallback
```

---

## 🎨 Variants & Semantic Color Palette

HELIX provides 5 standard variants defined in `src/bot/lib/embeds/variants.ts`:

| Variant | Method | Color Hex | Color Preview | Auto Title Emoji | When to Use |
|---|---|---|---|:---:|---|
| **Primary** | `.primary()` | `0x06b6d4` | Cyan | *(None)* | General info, /about, /stats, overview cards, default state |
| **Success** | `.success()` | `0x10b981` | Emerald | `✅` | Action completed, feed subscribed, setting saved, member role added |
| **Error** | `.error()` | `0xef4444` | Rose / Red | `❌` | Validation failure, permission denied, command failed, not found |
| **Warning** | `.warning()` | `0xf59e0b` | Amber | `⚠️` | Non-fatal issue, rate limit hit, confirmation prompt, partial success |
| **Info** | `.info()` | `0x3b82f6` | Blue | `ℹ️` | Tips, documentation links, queue status, audit instructions |

```typescript
// Variant selection examples:
handler.primary();           // Sets cyan, no emoji
handler.success();           // Sets emerald, auto-prepends '✅' to title
handler.error();             // Sets rose, auto-prepends '❌' to title
handler.warning();           // Sets amber, auto-prepends '⚠️' to title
handler.info();              // Sets blue, auto-prepends 'ℹ️' to title
handler.variant('warning');  // Dynamic variant string
```

---

## 📏 Limits & Character Budgeting

Discord enforces strict limits on embed dimensions. `EmbedHandler` defines safe operational limits (`TEXT_LIMITS`) and absolute Discord limits (`EMBED_LIMITS`):

| Embed Component | Discord Hard Limit | HELIX Recommended (`TEXT_LIMITS`) | Clamping Behavior |
|---|---|---|---|
| **Title** | 256 chars | **120 chars** | Auto-clamped at word boundary |
| **Description** | 4,096 chars | **350 chars** (default) | Configurable up to 4,096 chars via `.description(text, max)` |
| **Field Name** | 256 chars | **80 chars** | Auto-clamped |
| **Field Value** | 1,024 chars | **256 chars** (default) | Configurable up to 1,024 chars via `.field(name, val, inline, max)` |
| **Total Fields** | 25 fields | **25 fields** | Excess fields beyond 25 are safely ignored |
| **Footer Suffix** | 2,048 chars | **200 chars** | Formatted as `${appName} • ${suffix}` |
| **Author Name** | 256 chars | **256 chars** | Auto-clamped |
| **Total Embed** | 6,000 chars | **~3,500 chars** | Total characters across all components |

---

## 🛠️ Builder API Reference

### Title & Emoji Controls
```typescript
handler.title('Settings Updated');            // Uses variant emoji: "✅ Settings Updated"
handler.title('Clean Header', false);          // Suppresses emoji: "Clean Header"
handler.title('Custom Icon', '🚀');           // Uses custom emoji: "🚀 Custom Icon"
```

### Description & Text
```typescript
handler.description('Short descriptive summary of what happened.');
handler.description('A longer excerpt for articles or announcements...', 1000); // Custom max cap
```

### Fields & Sections
```typescript
// Inline field (default inline = true):
handler.field('Channel', '<#1234567890>', true);

// Custom max value cap:
handler.field('Raw Logs', logText, false, 800);

// Full-width section (inline = false):
handler.section('Configuration Details', 'Full-width markdown text goes here.');

// Bulk fields array:
handler.fields([
  { name: 'Server ID', value: '123456789', inline: true },
  { name: 'Owner', value: '<@987654321>', inline: true },
  { name: 'Created', value: '<t:1672531199:R>', inline: true },
]);
```

### Visual Assets & Links
```typescript
handler.thumbnail('https://example.com/icon.png');  // Small top-right thumbnail
handler.image('https://example.com/banner.png');     // Large full-width image banner
handler.url('https://github.com/HELIX-Origin');      // Makes title a clickable link
```

### Author & Footer
```typescript
// Custom author (defaults to bot branding if omitted):
handler.author('Target Member Name', 'https://avatar-url.png');

// Suppress author block completely:
handler.withoutAuthor();

// Suffix appended to app name: "HELIX Discord Bot • Case #42":
handler.footer('Case #42');

// Override footer text entirely (removes branding):
handler.rawFooter('Custom unbranded footer message');
```

### Timestamps & Colors
```typescript
handler.timestamp();                      // Defaults to current ISO timestamp
handler.timestamp('2026-09-17T12:00:00Z'); // Specific ISO string
handler.withoutTimestamp();               // Disables timestamp line
handler.color(0x9333ea);                  // Overrides variant color with custom hex
```

### Output Formats
```typescript
// 1. Interaction Response (Discord Slash Command Type 4)
handler.respond();             // Public response
handler.respond(true);         // Ephemeral response (visible only to invoking user)
handler.respond(EPHEMERAL);    // Equivalent to true

// 2. Raw DiscordEmbed Payload
const embed = handler.build(); // Returns DiscordEmbed object

// 3. Channel / Webhook Delivery Payload
const payload = handler.message(); // Returns { embeds: [embed] }
```

---

## 📐 Domain Embed Patterns & Blueprints

### Pattern 1: Slash Command Success / Acknowledgment
Standard response when a command executes a state change.

```typescript
return EmbedHandler.for(deps)
  .success()
  .title('Feed Added')
  .description(`Subscribed to **${feedTitle}** and routed to <#${channelId}>.`)
  .fields([
    { name: 'Feed Category', value: '`RSS / Atom`', inline: true },
    { name: 'Poll Interval', value: '`1 hour`', inline: true },
    { name: 'Delivery Mode', value: '`Channel Embed`', inline: true },
  ])
  .footer('Feed Manager')
  .respond();
```

---

### Pattern 2: Ephemeral Error / Permission Rejection
Private error notice informing the user of an issue without polluting the channel.

```typescript
return EmbedHandler.for(deps)
  .error()
  .title('Permission Denied')
  .description('You lack the required permissions to perform this action.')
  .fields([
    { name: 'Required Permission', value: '`Manage Messages`', inline: true },
    { name: 'Your Role', value: '`Member`', inline: true },
  ])
  .footer('Security Guard')
  .respond(true); // Ephemeral flag
```

---

### Pattern 3: Moderation Action Log Case
Structured mod log entry dispatched to the guild's dedicated mod log channel.

```typescript
const modEmbed = EmbedHandler.for(deps)
  .warning()
  .title('Member Warned', '⚠️')
  .thumbnail(targetUser.avatarUrl)
  .fields([
    { name: 'Target User', value: `<@${targetUser.id}> (\`${targetUser.id}\`)`, inline: true },
    { name: 'Moderator', value: `<@${moderatorUser.id}>`, inline: true },
    { name: 'Case', value: `\`#${caseNumber}\``, inline: true },
    { name: 'Reason', value: reason || '*No reason provided*', inline: false },
  ])
  .footer(`Case #${caseNumber}`)
  .timestamp()
  .build();

await rest.sendChannelMessage(modLogChannelId, { embeds: [modEmbed] });
```

---

### Pattern 4: Feed / Alert Syndication Delivery
Syndicated article, YouTube video, or Reddit post delivered to a channel or thread.

```typescript
const feedEmbed = EmbedHandler.for(deps)
  .primary()
  .title(articleTitle, false) // No variant emoji
  .url(articleUrl)
  .description(excerptText, 450)
  .image(articleImageUrl)
  .author(feedName, feedFaviconUrl)
  .fields([
    { name: 'Published', value: `<t:${Math.floor(publishedAt / 1000)}:R>`, inline: true },
    { name: 'Source', value: `[${sourceHost}](${articleUrl})`, inline: true },
  ])
  .footer(`Delivered via ${feedCategory.toUpperCase()}`)
  .timestamp()
  .message();

await rest.sendChannelMessage(targetChannelId, feedEmbed);
```

---

### Pattern 5: Detailed Information / Statistics Card
Comprehensive metrics overview (`/about`, `/stats`).

```typescript
return EmbedHandler.for(deps)
  .primary()
  .title('System Overview', '📊')
  .description('Live operational statistics for HELIX Discord Bot.')
  .fields([
    { name: 'Active Guilds', value: `\`${guildCount.toLocaleString()}\``, inline: true },
    { name: 'Active Feeds', value: `\`${feedCount.toLocaleString()}\``, inline: true },
    { name: 'Delivered Entries', value: `\`${deliveredCount.toLocaleString()}\``, inline: true },
    { name: 'Memory Usage', value: `\`${rssMb} MB RSS / ${heapMb} MB Heap\``, inline: true },
    { name: 'Node.js Version', value: `\`${process.version}\``, inline: true },
    { name: 'Uptime', value: `<t:${Math.floor((Date.now() - uptimeMs) / 1000)}:R>`, inline: true },
  ])
  .footer('Runtime Diagnostics')
  .respond();
```

---

## ✅ Design Do's and Don'ts

| Category | ✅ Do | ❌ Don't |
|---|---|---|
| **Emojis** | Let `.success()`, `.error()`, `.warning()` manage emojis automatically. | Manually add `❌` or `✅` in the title string when using `.error()` or `.success()`. |
| **Hierarchy** | Use inline fields for brief metrics (ID, User, Status) and `.section()` for long text. | Stack 10 full-width sections creating an excessively tall, unreadable embed. |
| **Colors** | Use standard semantic variants (`.primary()`, `.error()`, etc.). | Hardcode arbitrary random hex colors that break server theme harmony. |
| **Privacy** | Pass `true` or `EPHEMERAL` to `.respond()` for errors and private settings. | Expose admin errors or user input validation errors publicly in server channels. |
| **Branding** | Rely on `EmbedHandler.for(deps)` for dynamic app naming and icons. | Hardcode `'HELIX RSS'` or static bot avatar URLs. |
| **Text Clamping** | Allow `EmbedHandler` to clamp fields automatically. | Manually truncate strings with `str.slice(0, 100) + '...'` cutting off words awkwardly. |
| **Links** | Use standard Markdown links `[Link Text](https://url)` in descriptions and fields. | Paste long raw URLs that break column layouts. |
