# Skill: Feed Syndication & Dedicated Thread Delivery

## Overview
This skill details the feed syndication engine in **HELIX Discord Bot**, covering XML/Atom parsing, HTML scraping, weekly Free Games aggregation, YouTube/Twitch live alerts, target resolution, and dedicated thread delivery.

---

## 1. Supported Sources & Schedule

| Source | Feed Type | Ingestion Engine | Cadence |
|---|---|---|---|
| **RSS / Atom Feeds** | `rss` | Native XML tokenization (`src/feed/xml.ts`) | Configured interval (default 1h) |
| **Reddit Feeds** | `reddit` | Reddit RSS (Atom XML) | Configured interval |
| **HTML Web Scrapers** | `scrape` | Selector-based scraper (`src/feed/scraper.ts`) | Configured interval |
| **Free Games** | `free_games*` | Epic Store API + GamerPower API (`freegames.ts`) | **Weekly on Sunday** (`getUTCDay() === 0`) |
| **YouTube Uploads / Live** | `youtube` | Webhook subscription + periodic poll fallback | Real-time / 1h fallback |
| **Twitch Streams** | `twitch` | Webhook subscription + periodic poll fallback | Real-time / 1h fallback |

---

## 2. Thread Delivery Architecture: Single Thread Per Source

For thread-enabled guilds, **each feed source delivers into its own dedicated thread auto-created in the feed's configured text channel**:

```mermaid
flowchart TD
    FeedPoll[Feed Polled: New Entries] --> CheckThread{feed.threadChannelId exists?}
    
    CheckThread -->|No| Create[bot.createThread: open thread in feed.channelId, then send first entry]
    Create --> SaveThread[repo.setFeedThread: store thread ID in SQLite & AppState]
    SaveThread --> Propagate[Update feed.threadChannelId in memory for batch]
    
    CheckThread -->|Yes| FetchSnap[bot.getChannel: check thread status]
    FetchSnap --> IsArchived{Thread Archived?}
    IsArchived -->|Yes| Unarchive[bot.unarchiveThread: PATCH archived:false]
    IsArchived -->|No| Send[bot.sendChannelMessage into existing thread]
    Unarchive --> Send
    
    Send --> CheckMax{threadEntryCount >= threadMaxMessages?}
    CheckMax -->|Yes| Rotate[bot.archiveThread old thread & open fresh one]
    CheckMax -->|No| MarkSent[repo.markEntrySent]
    Rotate --> MarkSent
```

### Invariants for Thread Delivery:
1. **Thread ID Propagation**: In-memory `feed.threadChannelId` must be immediately updated upon thread creation so that subsequent entries in the same poll batch deliver to the same thread.
2. **Unarchive Sleeping Threads**: Discord auto-archives inactive threads after a configurable window. HELIX unarchives them (`unarchiveThread`) instead of creating a replacement thread.
3. **Only Replace on HTTP 404**: Replacement threads are opened ONLY if Discord returns 404 (Unknown Channel / deleted) or when message rotation is reached (`threadMaxMessages`).
4. **Threads Enabled Gate**: Thread delivery applies only when the global `THREADS_ENABLED` flag is on AND the feed's guild has thread delivery enabled (`discord_guilds.threads_enabled`); otherwise entries fall back to direct channel delivery.

---

## 3. Free Games Weekly Automation & Deduplication

1. **Sunday-Only Execution**:
   - `pollFeedLocked()` checks `new Date().getUTCDay() === 0`.
   - If not Sunday, polling is skipped.
   - Once polled on Sunday, `lastCheckedAt` matches `todayIso`, preventing multiple polls on the same Sunday.
2. **Title Normalization**:
   - `normalizeGameTitle(title)` strips store tags (e.g. `(Epic Games) Giveaway`, `(Steam) Giveaway`) to ensure identical games from Epic Store and GamerPower APIs are deduplicated before delivery.
