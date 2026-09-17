# Embed Migration Guide

Template for migrating commands/events to the new centralized `EmbedHandler` (`src/bot/lib/embeds/`).

## Quick Reference

```ts
import { EmbedHandler, EPHEMERAL } from '../../lib/embeds.js';

const handler = EmbedHandler.for(deps);
```

## Core Patterns

### Before → After

| Before | After |
|---|---|
| `createEmbed({ color: 0xef4444, title: '❌ Error', description: 'msg' })` | `handler.error().title('Error').description('msg').respond()` |
| `successEmbed('Title', 'desc', fields)` | `handler.success().title('Title').description('desc').fields([...]).respond()` |
| `errorResponse('Title', 'msg')` | `handler.error().title('Title').description('msg').respond(EPHEMERAL)` |
| `embedResponse(embed)` | `handler.build().respond()` / `handler.respond()` |
| `createEmbed({ footer: { text: 'HELIX Discord Bot' }})` | *auto-branded via `EmbedHandler.for(deps)`* |
| `flags: 64` | `handler.respond(true)` or `.respond(EPHEMERAL)` |
| `{ type: 4, data: { embeds: [embed] } }` | `handler.respond()` |
| Channel send: `{ embeds: [embed] }` | `handler.message()` |

### Variant Shorthands

```ts
handler.primary()    // 0x06b6d4, no emoji
handler.success()    // 0x10b981, ✅
handler.error()      // 0xef4444, ❌
handler.warning()    // 0xf59e0b, ⚠️
handler.info()       // 0x3b82f6, ℹ️
handler.variant('info') // same as info()
```

### Builder Chain

```ts
handler
  .success()
  .title('Feed Added')           // auto-prepends ✅
  .title('Custom', false)        // no emoji
  .title('With Emoji', '🔧')     // custom emoji
  .description('Details here')
  .description('Long text...', 350) // custom cap (default TEXT_LIMITS.description=350)
  .field('Name', 'Value', true)  // inline (default true)
  .field('Long Value', 'x'.repeat(500), true, 256) // custom cap (default 256)
  .section('Section', 'full-width value') // inline: false
  .fields([{ name: 'A', value: '1' }, { name: 'B', value: '2' }])
  .thumbnail('https://...')
  .image('https://...')
  .url('https://discord.com')
  .author('Author Name', 'icon-url')
  .footer('Command executed')     // → "AppName • Command executed"
  .rawFooter('Custom footer')     // overrides branding
  .color(0xff0000)                // override variant color
  .timestamp()                    // now ISO
  .timestamp('2024-01-01T00:00:00Z')
  .withoutTimestamp()             // suppress timestamp
  .withoutAuthor()                // suppress author
  .build()                        // DiscordEmbed
  .respond()                      // InteractionResponse
  .respond(EPHEMERAL)             // ephemeral InteractionResponse
  .message()                      // { embeds: DiscordEmbed[] } for channel sends
```

## Migration Checklist per File

For each command/event file:

- [ ] Import `EmbedHandler, EPHEMERAL` from `'../../lib/embeds.js'`
- [ ] Remove local `embedResponse`, `errorResponse`, `usageEmbed`, `commandHelpResponse`, `successEmbed` imports/helpers
- [ ] Remove hardcoded `color: 0x...`, `✅ `, `❌ `, `⚠️ `, `ℹ️ ` title prefixes
- [ ] Remove hardcoded `'HELIX Discord Bot'` footer strings
- [ ] Replace `flags: 64` with `EPHEMERAL` constant
- [ ] Wrap all embed builds with `EmbedHandler.for(deps)`
- [ ] Use `.field()` / `.section()` / `.fields()` for structured data
- [ ] Use `.footer('suffix')` for command-specific footer (auto-appends `AppName • `)
- [ ] Use `.rawFooter('exact text')` only when brand must be suppressed
- [ ] Use `.description(text, cap)` or `.field(name, value, inline, cap)` for length limits
- [ ] Use `.message()` for channel sends (`sendChannelMessage`)
- [ ] Use `.respond(EPHEMERAL)` for ephemeral responses
- [ ] Run `npm run check` after each file

## Command-Specific Patterns

### `info.ts` (User/Guild Info)
```ts
// Before: local errorResponse + inline embed object
// After:
const h = EmbedHandler.for(deps);
if (wantsGuild) {
  return h.info()
    .title('Server Info')
    .fields([
      { name: '🆔 Server ID', value: `\`${guildId}\``, inline: true },
      { name: '📅 Created', value: discordTimestamp(snowflakeDate(guildId)), inline: true },
      // ...
    ])
    .footer('Server Info')
    .respond();
}
return h.info()
  .title(displayName)
  .description(`<@${targetId}>`)
  .field('👤 Username', `@${username}`, true)
  .field('🆔 User ID', `\`${targetId}\``, true)
  // ...
  .footer('User Info')
  .thumbnail(avatarUrl)
  .respond();
```

### `about.ts` (Static Info)
```ts
const h = EmbedHandler.for(deps);
return h.primary()
  .title('About', '⚡')
  .description(`**${appName}** is a modern, lightweight RSS/Atom feed syndication service built specifically for Discord.`)
  .fields([
    { name: '📡 RSS & Atom Feeds', value: 'Automatic polling, deduplication, and rich embeds with primary images', inline: true },
    { name: '📣 Direct Channel Delivery', value: 'Dispatches updates straight to designated Discord channels', inline: true },
    // ...
  ])
  .footer('Feed Syndication')
  .respond();
```

### `stats.ts` (Service Status)
```ts
const h = EmbedHandler.for(deps);
return h.primary()
  .title('Service Status', '📊')
  .fields([
    { name: '📡 This Server', value: `**Feeds:** ${guildFeedsCount}`, inline: true },
    { name: '🌐 Global Totals', value: `**Feeds:** ${stats.feedCount}\n**Entries Sent:** ${stats.sentCount}`, inline: true },
    // ...
  ])
  .footer('Service Status')
  .respond();
```

### `help.ts` (Command Reference)
```ts
const h = EmbedHandler.for(deps);
if (query) {
  const cmd = commands.find(...);
  if (cmd) {
    return h.info()
      .title(`Help: /${cmd.name}`, '📖')
      .description(cmd.description)
      .description(`\`/${cmd.name} ${cmd.usage || ''}\``, 400) // usage
      .section('Subcommands', cmd.subcommands?.map(...).join('\n\n') ?? 'None')
      .section('Examples', cmd.examples?.map(e => `\`${e}\``).join('\n') ?? 'None')
      .footer('Slash Command Reference')
      .respond();
  }
  // not found
  return h.error()
    .title('Command Not Found', '❓')
    .description(`Could not find a command named \`/${query}\`.\n\n**Available commands:** ${list}`)
    .footer('Slash Command Reference')
    .respond(EPHEMERAL);
}
// categorized list
return h.primary()
  .title('Slash Commands', '📖')
  .description('Here is a list of all available slash commands grouped by category. Use `/help <command>` for detailed options and syntax.')
  .fields(categories.map(cat => ({
    name: `${cat.emoji} ${cat.name}`,
    value: cat.commands.map(cmd => `• \`/${cmd.name}\` — ${cmd.description}`).join('\n'),
    inline: false
  })))
  .footer('Type / in chat to run any command')
  .respond();
```

### `set.ts` (Guild Settings)
```ts
const h = EmbedHandler.for(deps);
const action = optionValue(options, 'action');

switch (action) {
  case 'role':
    // changes array already built
    return h.success()
      .title('Roles Updated')
      .field('Changes', changes.join('\n'), false)
      .respond();
  case 'feature':
    return h.success()
      .title(`Feature ${enabled ? 'Enabled' : 'Disabled'}`)
      .description(`**${FEATURE_LABELS[name]}** is now ${enabled ? '**enabled**' : '**disabled**'} for this server.`)
      .respond();
  case 'prefix':
    if (!value) {
      return h.success()
        .title('Prefix Cleared')
        .description('This server no longer uses a custom command prefix.')
        .respond();
    }
    return h.success()
      .title('Prefix Updated')
      .description(`Custom command prefix is now \`${value}\`. Leave the value empty to reset to slash-commands-only mode.`)
      .respond();
  case 'view':
    return h.info()
      .title(`${guildName} — Guild Configuration`, '⚙️')
      .field('🎭 Roles', `**DJ:** ${djRole ? `<@&${djRole}>` : 'Not set'}\n**Admin:** ${adminRole ? `<@&${adminRole}>` : 'Not set'}`, false)
      .field('⚙️ Features', featureLines.join('\n'), false)
      .field('🔤 Command Prefix', prefix ? `\`${prefix}\`` : 'Slash commands only', false)
      .footer('Guild Configuration')
      .respond();
  case 'reset':
    return h.success()
      .title('Settings Reset')
      .description(details.join('\n'))
      .field('Reset Scope', rawTarget === 'all' ? 'Everything' : `\`${rawTarget}\``, false)
      .respond();
  default:
    return h.info()
      .title('Set Command Usage', '⚙️')
      .description('Use `/set` with one of the actions below.')
      .field('🎭 role', '`/set action:role dj:@MusicRole` · `admin:@Staff` · `clear:dj`', false)
      .field('⚙️ feature', '`/set action:feature feature:music enabled:True`', false)
      .field('🔤 prefix', '`/set action:prefix value:!`', false)
      .field('👁️ view', '`/set action:view`', false)
      .field('♻️ reset', '`/set action:reset reset_target:roles`', false)
      .respond();
}
```

### `welcome.ts` (Welcome System)
```ts
const h = EmbedHandler.for(deps);
const action = optionValue(options, 'action');

switch (action) {
  case 'channel':
    return h.success()
      .title('Welcome Channel Set')
      .description(`Welcome messages will be delivered to <#${channelId}>. Use \`/welcome action:message\` to customize the message and \`/welcome action:test\` to preview it.`)
      .respond();
  case 'message':
    // validation...
    return h.success()
      .title('Welcome Message Updated')
      .field('Message', content.slice(0, 256), false)
      .field('Format', embed ? 'Embed' : 'Plain text', true)
      .field('Color', rawColor, true)
      .field('Thumbnail', 'User avatar', true)
      .respond();
  case 'disable':
    return h.success()
      .title('Welcome System Disabled')
      .description('New member welcome messages have been turned off for this server.')
      .respond();
  case 'view':
    return h.info()
      .title(`${guildName} — Welcome Configuration`, '👋')
      .description(config.enabled ? 'Welcome messages are **enabled**.' : 'Welcome messages are **disabled**. Set a channel with `/welcome action:channel` to enable.')
      .field('📢 Channel', config.channelId ? `<#${config.channelId}>` : 'Not configured', true)
      .field('🎨 Format', config.embed ? 'Embed' : 'Plain text', true)
      .field('📝 Message', config.message.slice(0, 256), false)
      .footer('Welcome Configuration')
      .respond();
  case 'test':
    // send via sendWelcomeMessage(bot, config, ...) - uses embedMessage()
    return h.success()
      .title('Test Welcome Sent')
      .description(`A test welcome message was delivered to <#${config.channelId}>.`)
      .respond();
  default:
    return h.info()
      .title('Welcome Command Usage', '👋')
      .description('Use `/welcome` with one of the actions below.')
      .field('📢 channel', '`/welcome action:channel channel:#welcome`', false)
      .field('📝 message', '`/welcome action:message content:"Welcome {user}!" embed:True`', false)
      .field('🧪 test', '`/welcome action:test`', false)
      .field('👁️ view', '`/welcome action:view`', false)
      .field('🚫 disable', '`/welcome action:disable`', false)
      .respond();
}
```

### `ticket.ts` (Ticket System)
```ts
const h = EmbedHandler.for(deps);
const action = optionValue(options, 'action');

switch (action) {
  case 'setup':
    return h.success()
      .title('Ticket System Configured')
      .description('Tickets are now **enabled** for this server.')
      .field('Forum Channel', categoryId ? `<#${categoryId}>` : config.categoryId ? `<#${config.categoryId}>` : 'Not set', true)
      .field('Manager Role', `<@&${managerRoleId}>`, true)
      .field('Transcript Channel', transcriptChannelId ? `<#${transcriptChannelId}>` : config.transcriptChannelId ? `<#${config.transcriptChannelId}>` : 'Not set', true)
      .field('Log Channel', logChannelId ? `<#${logChannelId}>` : config.logChannelId ? `<#${config.logChannelId}>` : 'Not set', true)
      .respond();
  case 'view':
    return h.info()
      .title(`${guildName} — Ticket Configuration`, '🎫')
      .description(config.enabled ? 'Ticket system is **enabled**.' : 'Ticket system is **disabled**.')
      .field('📂 Forum Channel', config.categoryId ? `<#${config.categoryId}>` : 'Not set', true)
      .field('👮 Manager Role', config.managerRoleId ? `<@&${config.managerRoleId}>` : 'Not set', true)
      .field('📜 Transcript Channel', config.transcriptChannelId ? `<#${config.transcriptChannelId}>` : 'Not set', true)
      .field('📋 Log Channel', config.logChannelId ? `<#${config.logChannelId}>` : 'Not set', true)
      .field('👋 Ticket Welcome', config.welcomeMessage.slice(0, 256), false)
      .footer('Ticket Configuration')
      .respond();
  // ... other cases use h.success()/h.error()/h.info() similarly
  default:
    return h.info()
      .title('Ticket Command Usage', '🎫')
      .description('Use `/ticket` with one of the actions below.')
      .field('⚙️ setup', '`/ticket action:setup manager_role:@Support category:#tickets`', false)
      // ...
      .respond();
}
```

### `feed.ts` (Feed Management)
```ts
const h = EmbedHandler.for(deps);
const action = optionValue(options, 'action');

switch (action) {
  case 'add':
    return h.success()
      .title('Feed Added Successfully')
      .field('Feed Name', feed.name, true)
      .field('Feed ID', `#${feed.id}`, true)
      .field('Type', feed.feedType.toUpperCase(), true)
      .field('Target Channel', targetChannelId ? `<#${targetChannelId}>` : 'None', true)
      .field('Feed URL', `\`${feed.url}\``, true)
      .footer('Direct Bot Delivery')
      .respond();
  case 'list':
    if (feeds.length === 0) {
      return h.info()
        .title('Feeds for this Server', '📡')
        .description('No feeds configured yet. Use `/feed action:add` to configure your first RSS feed!')
        .respond();
    }
    return h.primary()
      .title(`Feeds for this Server (${feeds.length})`, '📡')
      .fields(feeds.slice(0, 25).map(f => ({
        name: `#${f.id} — ${f.name} (${f.enabled ? '🟢 Enabled' : '⏸️ Paused'})`,
        value: `**URL:** \`${f.url}\`\n**Channel:** ${f.threadChannelId ? `<#${f.threadChannelId}> (thread)` : f.channelId ? `<#${f.channelId}>` : 'None'}\n**Last Checked:** ${f.lastCheckedAt ? new Date(f.lastCheckedAt).toLocaleString() : 'Never'}`,
        inline: true
      })))
      .footer('Use /feed action:remove or /feed action:toggle')
      .respond();
  case 'remove':
    return h.success()
      .title('Feed Deleted', '🗑️')
      .description(`Removed feed **${feed.name}** (\`#${feed.id}\`).`)
      .respond();
  case 'toggle':
    return h.success()
      .title(enabled ? 'Feed Resumed' : 'Feed Paused', enabled ? '▶️' : '⏸️')
      .description(`Feed **${feed.name}** (\`#${feed.id}\`) is now ${enabled ? '**enabled** and will be polled automatically.' : '**paused**.'}`)
      .respond();
  default:
    return h.info()
      .title('Feed Command Usage', '📡')
      .description('Use `/feed` with one of the actions below.')
      .field('➕ add', '`/feed action:add name:"TechCrunch" url:"https://techcrunch.com/feed/" channel:#news`', false)
      .field('📋 list', '`/feed action:list`', false)
      .field('🗑️ remove', '`/feed action:remove feed_id:123`', false)
      .field('▶️ toggle', '`/feed action:toggle feed_id:123 enabled:True`', false)
      .respond();
}
```

### `music.ts` (Music Commands)
```ts
const h = EmbedHandler.for(deps);
// For play/queue/nowplaying embeds
return h.success()
  .title(tracks.length > 1 ? 'Playlist Added' : 'Track Queued', '📋')
  .description(tracks.length > 1 ? `Added **${tracks.length}** tracks` : `**[${track.title}](${track.uri})** \`${formatDuration(track.length)}\``)
  .field('Duration', formatDuration(track.length), true)
  .field('Source', track.sourceName, true)
  .field('Queue Position', `${player.queue.length}`, true)
  .thumbnail(track.artworkUrl ?? '')
  .footer(`Requested by ${username}`)
  .withoutAuthor() // custom footer without branding
  .respond();

// nowplaying
return h.primary()
  .title('Now Playing', '🎵')
  .description(`**[${title}](${uri})**\n${isLive ? '🔴 LIVE' : \`${progress} / ${length}\n${progressBar}\`}`)
  .field('Requested by', `<@${requester}>`, true)
  .field('Volume', `${volume}%`, true)
  .field('Loop', `${loop}`, true)
  .thumbnail(artworkUrl)
  .footer(`Source: ${sourceName}`)
  .withoutAuthor()
  .respond();
```

### `gif.ts` (GIF Command)
```ts
const h = EmbedHandler.for(deps);
if (!deps.config.klipyApiKey) {
  return h.info()
    .title('Help: /gif', '📖')
    .description('Get a random GIF or filter by category')
    .field('Usage', '`/gif [category]`', false)
    .field('Examples', '`/gif`\n`/gif anime`\n`/gif slap`', false)
    .respond();
}

// On success:
const payload = h.primary()
  .image(gifUrl)
  .footer('Powered by KLIPY')
  .withoutAuthor()
  .message(); // { embeds: [...] } for channel send with content

return {
  type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
  data: { content: `Here's your GIF${category ? ` (${category})` : ''}!`, embeds: payload.embeds }
};
```

## Feed Watcher & Webhook (`feed/watcher.ts`, `dashboard/webhooks/router.ts`)

Use `embedMessage()` for channel sends:

```ts
import { EmbedHandler } from '../../lib/embeds.js';

const h = EmbedHandler.for(deps);
// feedEmbed → replaced by:
return h.primary()
  .title(cleanTitle(entry.title))
  .url(entry.url)
  .description(cleanDesc)
  .fields([
    { name: '💬 Discussion', value: `[View on Reddit 💬](${entry.url})`, inline: true },
    { name: '📎 Related Links', value: extraLinks.map(l => `• [${l.label}](${l.url})`).join('\n'), inline: extraLinks.length === 1 },
  ])
  .author(authorName, brandIconUrl)
  .footer(feedTitle)
  .timestamp(publishedAt)
  .thumbnail(brandIconUrl)
  .image(primaryImage)
  .message(); // { embeds: [...] }
```

## Events (`events/member.ts` - Welcome)

Welcome messages are sent via `sendWelcomeMessage` which builds a channel embed. Refactor to use `embedMessage()`:

```ts
const h = EmbedHandler.for(deps);
const embed = config.embed
  ? h.primary()
      .color(config.color ?? EMBED_COLORS.SUCCESS)
      .description(content)
      .thumbnail(config.thumbnail && avatarUrl ? avatarUrl : undefined)
      .image(config.banner ? config.banner : undefined)
      .withoutAuthor()
      .message()
  : null;

if (embed) {
  await bot.sendChannelMessage(config.channelId, { embeds: embed.embeds });
} else {
  await bot.sendChannelMessage(config.channelId, { content });
}
```

## Constants Reference

```ts
// From TEXT_LIMITS (soft caps - auto-clamped)
TEXT_LIMITS.title = 120;
TEXT_LIMITS.description = 350;
TEXT_LIMITS.fieldValue = 256;
TEXT_LIMITS.footerSuffix = 200;

// From EMBED_LIMITS (hard Discord limits - builder enforces)
EMBED_LIMITS.fields = 25;

// EPHEMERAL constant
EPHEMERAL = 64;
```

## Verification

After each file migration:
```bash
npm run check  # typecheck + format:check + lint
npm run build
```

All must pass. Commit when all 12 commands + watcher + events migrated.