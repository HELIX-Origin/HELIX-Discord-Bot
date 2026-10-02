# HELIX Discord Bot — Sprint & Planning Log

> 🗺️ **Living Source of Truth**: This page records current sprint plans, implementation decisions, and completed work. See [`TODO.md`](./TODO.md) for workstream checklists, [`BUGS.md`](./BUGS.md) for open bugs, and [`ROADMAP.md`](./ROADMAP.md) for long-term milestones.

> [!IMPORTANT]
> AI agents strictly required to update this page and all related pages **before** working on any new bug fixes or features and push it to the remote first, without exception. Failure to do so may result in working with outdated information and potentially introducing conflicts or redundant work. 

---

## 📜 Tracking Rules

- **No Typo Duplication**: When recording user reports, clean and fix all typos to preserve professional quality.
- **Consistent Formatting**: Maintain consistent formatting and style throughout all documentation to ensure readability and professionalism.
- **Clear Sectioning**: Use clear and descriptive headers for each section to improve navigation and readability.
- **Active Items First**: The currently active milestone, sprint, task, or workstream must always be placed at the top of the content sections.
- **Regular Updates**: Ensure that the roadmap is regularly updated to reflect the latest developments and changes in the project.
- **Improve User Directives**: Continuously refine and clarify user directives to ensure they are easily understood and actionable.
- **Universal Direct Store Links**: Every game alert, giveaway, or deal **MUST** resolve to the actual storefront page of the game.
- **Always Track Everything**: Every new feature request, enhancement, or bug report must be logged in [`BUGS.md`](./BUGS.md), [`TODO.md`](./TODO.md), and [`ROADMAP.md`](./ROADMAP.md) before execution.

---

## 🎯 Active Sprints

### 🎮 Sprint 1: Game Feeds Tab Evolution

> Plan and implement the expansion of the Free Games tab into a Game Feeds area supporting Free Game Alerts, Deals & Promotions, and Patch Notes.

#### 📝 Tasks 

```mermaid
flowchart TD
    A["Game feed sources"] --> B["Free game alerts (100% off)"]
    A --> C["Deals and promotions (sales)"]
    A --> D["Patch notes (updates)"]
    B --> E["Universal direct store URL resolution"]
    C --> E
    D --> E
    E --> F["Deliver canonical embed without footer"]
```

**Progress as of 2026-10-02 session:**

1. ✅ **Data Model & Type Registry** — `game_deals_*` and `game_patchnotes_*` feed types added to `src/state/types.ts`. `feedCategory()` and `rowToGuildCategory()` updated.

2. ✅ **Feed Fetchers & Direct URL Engine** — `src/feed/gamedeals.ts` (CheapShark API, redirect resolution) and `src/feed/patchnotes.ts` (Steam News API, 11 preset games) implemented. Pollers wired into `FeedWatcher.pollFeed`.

3. ✅ **Embed Layouts** — `gameDealsEmbed` (pricing, discount badge, no footer) and `patchNotesEmbed` (version, summary, no footer) implemented in `src/bot/utils/embeds.ts`.

4. ✅ **Dashboard UI** — Sidebar tab renamed to "Game Feeds" (`fa-gamepad`). Sources dropdown redesigned with optgroups. `GAME_FEEDS_OPTIONS` catalog added to `clientScript.ts`. `submitAddFreeGamesFeed`, `categoryForFeed`, `feedTopicOf`, and `renderFeedPill` all updated.

5. ✅ **Slash Command** — `/free-games` expanded to cover all game feed types. `PLATFORM_NAMES` now maps all 16 feed keys. `isGameFeed` predicate covers all three categories.

6. ✅ **Tests** — `tests/unit/feed/gameFeeds.test.ts` added. **395/395 tests passing**.

7. ✅ **Build gate + branch push** — `npm run build` clean. Pushed to `feat/game-feeds-w11`. Awaiting merge to `main`.

---

## ✅ Completed Sprints

### Sprint: Stream Alerts Manual Trigger Delivery & Dual YouTube/Twitch Ingestion

- Passed `force: boolean` through `pollFeed` down to `pollStreamAlertFeed(userId, feed, force)`.
- Implemented forced delivery fallback: when `force === true && toSend.length === 0`, deliver `entries[0]` so manual checks provide immediate verification.
- Added offline VOD fallback for Twitch: on forced manual checks for offline streamers, query `/helix/videos` to retrieve and post the most recent broadcast.
- Implemented dual ingestion for YouTube: sorted public Atom feed entries newest first by published timestamp to support both live streams and video uploads seamlessly.
- Added graceful diagnostic logging when Twitch or YouTube credentials are unconfigured.
- Added unit test suite in `tests/unit/feed/streamAlerts.test.ts` verifying all fallback paths and forced manual delivery (390 passing tests).

### Sprint: Free Games Provider-Based Architecture & Direct Store URL Resolution

- Restructured Free Game feeds around genuine providers (`GamerPower Free Game Alerts`, `Epic Games Store Official`, and `All Free Game Drops`).
- Removed the footer from `freeGameEmbed` and displayed the storefront platform in the `🏷️ Platform` field with matching author branding.
- Implemented `resolveDirectGiveawayUrl` to follow up to five redirects with timeout protection.
- Implemented `detectStorePlatform` for Steam, GOG, IndieGala, Stove, Epic Games Store, Itch.io, Humble Bundle, Ubisoft, EA App, Prime Gaming, and Battle.net.
- Added dedicated Stove branding and the `free_games_stove` feed type.
- Cleaned up reported user typos in `BUGS.md` and verified with Vitest tests.

---

## 🛠️ Verification Commands

```bash
npm run check               # typecheck + format:check + lint + tests (must pass)
npm run build               # tsc compile to dist/ (must pass)
npm test                    # vitest run
```

---

## 🔖 Metadata

- **Project**: HELIX Discord Bot · **version** 0.6.0
- **Agent Ecosystem:** [`AGENTS`](./AGENTS) and [`.agents/`](.agents/) are tracked directly in repository git tracking.
