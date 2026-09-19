# Feed Watcher Agent (Sub-Agent)

**Parent Primary**: [Code Architect](../code-architect)  
**Focus**: Engineering

The **Feed Watcher Agent** governs the feed syndication, live stream alerting, and delivery subsystem in **HELIX Discord Bot**. It oversees RSS/Atom/JSON parsing, HTML scraping, weekly Free Games aggregation, YouTube/Twitch live alerts, and dedicated thread delivery.

---

## Architecture

```mermaid
flowchart TD
    Scheduler["Interval Scheduler"] --> Enumerate["Enumerate Enabled Feeds"]
    Enumerate --> Lock["Acquire Feed Lock (ioredis-mock)"]
    Lock -->|"Locked"| Skip["Skip Concurrent Run"]
    Lock -->|"Acquired"| RouteType{"Feed Type"}
    
    RouteType -->|"RSS / Atom / Reddit"| FetchXML["fetchRaw & parseFeed"]
    RouteType -->|"HTML Scrape"| FetchHTML["fetchRaw & scrapeItems"]
    RouteType -->|"Free Games"| FreeGamesEngine["Weekly Sunday Aggregator"]
    RouteType -->|"YouTube / Twitch"| StreamAlertEngine["Webhook Receiver / Poll Fallback"]
    
    FetchXML --> Dedupe{"isEntrySent Check"}
    FetchHTML --> Dedupe
    FreeGamesEngine --> Dedupe
    StreamAlertEngine --> Dedupe
    
    Dedupe -->|Already Sent| Drop[Ignore Entry]
    Dedupe -->|New Entry| TargetRes{resolveFeedTargets}
    
    TargetRes -->|Channel + threadsEnabled guild| ThreadDelivery[FeedThreadManager: Single Thread per Source]
    TargetRes -->|Channel| ChannelDelivery[DiscordBot: sendChannelMessage]
    
    ThreadDelivery --> MarkSent[markEntrySent: SQLite + AppState]
    ChannelDelivery --> MarkSent
```

---

## Key Responsibilities

1. **Feed Syndication**:
   - RSS 2.0, Atom 1.0, JSON, and Reddit feeds.
   - Robust XML tokenization without bulky external parsers (`src/feed/xml.ts`).
   - Resilient HTML item scraping using CSS-like selectors (`src/feed/scraper.ts`).

2. **Dedicated Thread Delivery**:
   - Dedicates a single thread per feed source, auto-created in the feed's delivery channel (`FeedThreadManager`).
   - Automatically unarchives sleeping threads before posting new entries.
   - Rotates threads cleanly when entry count reaches `threadMaxMessages`.

3. **Weekly Sunday Free Games Aggregation**:
   - Gated to run once weekly at the start of Sunday (`getUTCDay() === 0` UTC).
   - Combines official Epic Games Store promotions and GamerPower giveaways.
   - Applies title normalization (`normalizeGameTitle`) to prevent duplicate posts across providers.

4. **Stream Alerts (YouTube & Twitch)**:
   - Primary real-time delivery via PubSubHubbub / Twitch EventSub webhooks.
   - Automated polling fallback for resilience.

---

## Operational Verification

```bash
# Typecheck feed subsystem
npm run typecheck

# Full validation gate
npm run check
```