# HELIX Discord Bot — Current Session Plan

> 🏷️ **Tracking**: Companion to [`TODO.md`](./TODO.md) (checklists), [`BUGS.md`](./BUGS.md) (bug tracker), and [`ROADMAP.md`](./ROADMAP.md) (long-term architecture). Roadmap issue: [#27](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/27).


> 📝 **Note**: This file is being rewritten to serve as a comprehensive log of all plans in this repo. It will track plans via detailed and extensive sprint tracking with step by step plans in each sprint. The [`TODO.md`](./TODO.md) file will list every Milestone with a detailed list of all associated tasks.
>
> This update will allow the [`PLAN.md`](./PLAN.md) file to serve as not only a planning log, but also a historical record of every feature and plan made in this project. It will continue to evolve alongside the development of the HELIX Discord Bot, capturing all changes, decisions, and implementations for future reference.
>
> This update is part of a structured rewrite to our [`PLAN.md`](./PLAN.md), [`TODO.md`](./TODO.md), [`ROADMAP.md`](./ROADMAP.md), and [`BUGS.md`](./BUGS.md) files to ensure consistent and comprehensive tracking of all development activities, plans, and issues across the HELIX Discord Bot project.
> 
> We currently have no ETA on when this rewrite will be completed since we are still in the process of defining the new structure and ensuring that all existing plans, tasks, and issues are accurately captured and integrated into the updated format. This is dependent on the ongoing review and consolidation of all current documentation and planning artifacts as well as our AI credit limits which are currently used up.

---

## 🎯 Active Sprint

### Goal 1: Stream Alerts (YouTube & Twitch) Manual Trigger Delivery Fix

**User directive**: "Also the YouTube and Twitch Alerts. When manually triggered, they should get the last stream/video posted. Right now they post nothing and it makes me think they aren't working at all."

#### Root Cause Analysis
1. `src/feed/watcher.ts`: `pollStreamAlertFeed` checks `this.repo.isEntrySent(feed.id, entry.id)` and `redis.isEntrySent(...)`.
2. When a user clicks "Check Now" or invokes `/api/feeds/:id/poll`, if the channel's latest video or current stream was already delivered or if the channel is currently offline, `toSend` is empty, resulting in complete silence.
3. Fix: Propagate `force = true` to `pollStreamAlertFeed`. When `force` is set and no new unposted items exist, deliver the most recent video/broadcast with a clear confirmation banner so the user receives immediate feedback that their feed is configured and functioning.

#### Implementation Steps
1. In `src/feed/watcher.ts`: Update `pollStreamAlertFeed(userId: number, feed: Feed, force = false)` signature and caller.
2. In `pollStreamAlertFeed`: When `force === true` and `toSend.length === 0`: retrieve `entries[0]` (if available) and deliver as an immediate verification post.
3. Update unit tests in `tests/unit/feed/streamAlerts.test.ts` to assert that manual force checks deliver the latest entry.
4. Verify full test suite: `npm test && npm run build`.

---

### Goal 2: Game Feeds Tab Evolution (Planning & Architecture)

**User directive**: "We also need to plan an upgrade to the Free Games tab. It will become a Game Feeds tab and will support three types of feeds from the provided feed sources: Free Game Alerts, Deals and Promotions, Patch Notes."

#### Feature Scope
1. **Free Game Alerts**: 100% off giveaways and permanent claims (GamerPower + Epic Games Store API). Embeds display value, availability, platform, and direct claim link (no footer).
2. **Deals and Promotions**: Discounted PC games on sale (non-free). Embeds display discount %, original price, current sale price, savings, and direct store link.
3. **Patch Notes**: Game updates, balance changes, and changelogs. Embeds display game title, version/build, highlights summary, and direct changelog link.

#### Architecture Checklist
- [ ] Database / Types: `src/state/types.ts` (`free_games_*`, `game_deals_*`, `game_patchnotes_*`).
- [ ] Fetchers: `src/feed/gamedeals.ts` and `src/feed/patchnotes.ts` with universal direct store URL resolution.
- [ ] Embeds: `gameDealsEmbed` and `patchNotesEmbed` in `src/bot/utils/embeds.ts`.
- [ ] Dashboard UI: Rename tab to `Game Feeds` (`#tab-gamefeeds`), add category sub-tabs/filters, and one-click pill catalogs for all three types.
- [ ] Slash Commands: `/game-feeds` with choices for all 3 categories.
- [ ] Documentation: Update wiki/docs pages `Feeds-and-Scrapers.md` and `Free-Games-Feeds.md` (renamed to `Game-Feeds.md`).

---

## ✅ Completed in Recent Sprint

### Free Games Provider-Based Architecture & Direct Store URL Resolution
- Restructured Free Game feeds around genuine providers (`GamerPower Free Game Alerts`, `Epic Games Store Official`, `All Free Game Drops`).
- Removed `footer` from `freeGameEmbed` entirely.
- Guaranteed storefront platform is displayed in `🏷️ Platform` embed field.
- Implemented `resolveDirectGiveawayUrl` to follow 3xx redirects (up to 5 hops with timeout protection) guaranteeing every alert links directly to the actual store page.
- Implemented `detectStorePlatform` with support for Steam, GOG, IndieGala, Stove, Epic Games Store, Itch.io, Humble Bundle, Ubisoft, EA App, Prime Gaming, and Battle.net.
- Added dedicated `Stove` platform branding and `'free_games_stove'` feed type.
- Cleaned up user typos in `BUGS.md` and verified all 387 Vitest unit tests pass.