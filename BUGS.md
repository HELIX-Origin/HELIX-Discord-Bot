# HELIX Discord Bot — Bug Tracker

> 🐛 **Living Source of Truth**: This page tracks known, unresolved bugs. Resolved or superseded entries are removed; implementation tasks belong in [`TODO.md`](./TODO.md), sprint plans in [`PLAN.md`](./PLAN.md), and long-term milestones in [`ROADMAP.md`](./ROADMAP.md).

> [!IMPORTANT]
> AI agents strictly required to update this page and all related pages **before** working on any new bug fixes or features and push it to the remote first, without exception. Failure to do so may result in working with outdated information and potentially introducing conflicts or redundant work. 

---

## 📖 Legend

### 🚦 Status

- ⚠️ **open** — reproducible, needs fixing *(Detailed lists with possible fixes encouraged. Attempt to include steps to reproduce, expected behavior, and actual behavior. An estimate of how long it might take to fix is also helpful.)*
- 🚧 **investigating** — repro/root-cause in progress *(List of issues currently being worked on. Used for tracking active work. must reference an existing bug from the open section.)*
- 🚫 **wontfix** — accepted limitations *(features that can't be fixed at this time without significant changes or trade-offs)*
- ✅ **resolved** — verified and fixed *(moved to closed with the corresponding release version or commit)*

### 🚨 Severity

- 🔴 **Critical**: *Bugs that cause crashes or major functionality loss.*
- 🟠 **High**: *Bugs that significantly impact usability but do not crash the app.*
- 🟡 **Medium**: *Bugs that affect certain features or have minor usability issues.*
- 🟢 **Low**: *Minor bugs or visual glitches that do not significantly impact the user experience.*

---

## 🚫 Known quirks & external limitations (wontfix bucket)

- 🐢 **External Feed Throttling & Rate Limits:** Upstream APIs (Reddit, YouTube, Twitch, GamerPower) enforce rate limits. Handlers and background workers throttle requests and implement exponential backoff rather than spam-retrying.
- **Discord API Gateway & Rate Limits:** Discord enforces global and route-specific rate limits on interaction responses, guild command syncs, and embeds. Guild command updates must be debounced.

## 💡 Explicitly not bugs

- Disabled features intentionally hide their corresponding dashboard navigation links and unregister their slash commands from Discord guilds rather than rendering disabled error embeds.

---

## 2026-10-02 — YouTube and Twitch Alerts Post Nothing on Manual Trigger Check

- **Severity**: 🟠 High (Stream Alerts / User Feedback)
- **Status**: ⚠️ open
- **Reported Issue**: "When YouTube and Twitch alerts are manually triggered, they should get the last stream or video posted. Right now they post nothing and it makes me think they aren't working at all. Note that YouTube and Twitch alerts might be dependent on API keys to work for what we are using them for, and might be failing due to how we are implementing them. Live streams are intended to only post when a streamer is live, but YouTube feeds support both live streams and video uploads. So that one needs to be able to handle both cases. The manual poll on Twitch should find the most recent live stream since it is intended as a way for users to test their integrations. YouTube should find either the most recent live stream or the newest upload (whichever came most recently)."

### Root Cause

1. **Twitch API Live Broadcast Limit & Missing API Credentials**: The Helix `/streams` endpoint returns active live broadcasts only. When a streamer is offline, the poller returns zero items. Additionally, the Twitch poller requires `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`; without them or when channels are offline, manual triggers complete silently with zero feedback.
    - **Impact**: Users cannot test or verify their Twitch feed integration when a streamer is not actively live, making the feature appear completely broken.
    - **Proposed Fix**:
        - **Recent Live Stream / VOD Fallback for Manual Testing**: On a forced manual check (`force = true`), query `/helix/streams` first, and if offline, query `/helix/videos` for the streamer's most recent live stream/VOD to verify the integration.
        - **Clear Credential Diagnostics**: Provide actionable console logging and API feedback when `TWITCH_CLIENT_ID` or `TWITCH_CLIENT_SECRET` are missing.
    - **Steps to Implement**:
        - **Pass force flag**: Propagate `force: boolean` through `pollFeed` down into `pollStreamAlertFeed(userId, feed, force)`.
        - **Query latest stream on force**: In `fetchTwitchFeed`, fall back to the most recent broadcast/video when `force === true` and channel is offline.
        - **Deliver verification post**: Post the resolved stream as a verification test.

2. **YouTube Dual Delivery & Silent Deduplication Gate**: YouTube feeds are required to support both live streams and regular video uploads. During routine polling, new live broadcasts or new video uploads should alert users. Furthermore, manual checks currently check `isEntrySent` deduplication; if the latest video was already posted previously, the poller discards it and produces no output.
    - **Impact**: Manual trigger checks fail to produce any Discord post if no new unposted video exists, misleading users into believing the feed is dysfunctional.
    - **Proposed Fix**:
        - **Dual Support (Live Streams + Uploads)**: Ensure `fetchYouTubeFeed` extracts both live streams and video uploads, returning whichever came most recently.
        - **Deliver Latest Item on Force**: On manual force poll, when `toSend.length === 0`, deliver `entries[0]` (the most recent video or live stream) as a verification post.
        - **Zero-Config Public Atom Feed Priority**: Rely on the zero-config Atom XML feed (`channel_id=UC...`) and fall back to Data API v3 when configured.
    - **Steps to Implement**:
        - **Order entries by timestamp**: In `fetchYouTubeFeed`, verify items are properly sorted by published date.
        - **Deliver verification item**: In `pollStreamAlertFeed`, deliver `entries[0]` when `force === true` and `toSend.length === 0`.
        - **Add API diagnostics**: Report clear diagnostic messages if channel handle resolution or API requests fail.

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
