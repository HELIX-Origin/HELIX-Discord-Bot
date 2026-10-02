# HELIX Discord Bot — Bug Tracker

> 🐛 **Living Source of Truth**: This page tracks known, unresolved bugs. Resolved or superseded entries are removed; implementation tasks belong in [`TODO.md`](./TODO.md), sprint plans in [`PLAN.md`](./PLAN.md), and long-term milestones in [`ROADMAP.md`](./ROADMAP.md).

> [!IMPORTANT]
> Review and update this page when a bug is reported or investigated. Keep entries actionable and synchronize related work with the other tracking files.

---

## 📖 Legend

### 🚦 Status

- ⚠️ **Open** — reproducible and needs fixing.
- 🚧 **Investigating** — reproduction or root-cause analysis is in progress; reference the related open bug.
- 🚫 **Won't fix** — accepted limitation or trade-off.
- ✅ **Resolved** — verified as fixed; remove the entry from this active tracker.

### 🚨 Severity

- 🔴 **Critical** — crashes or causes major functionality loss.
- 🟠 **High** — significantly impacts usability without crashing the application.
- 🟡 **Medium** — affects a limited feature or causes a minor usability issue.
- 🟢 **Low** — minor issue or visual glitch.

---

## 🚫 Known Quirks & External Limitations

- 🐢 **External feed throttling and rate limits**: Upstream APIs (Reddit, YouTube, Twitch, and GamerPower) enforce limits. Handlers and background workers throttle requests and use exponential backoff rather than repeatedly retrying.
- **Discord API rate limits**: Discord enforces global and route-specific limits on interaction responses, guild command syncs, and embeds. Guild command updates must be debounced.

## 💡 Explicitly Not Bugs

- Disabled features intentionally hide their dashboard navigation links and unregister their slash commands from Discord guilds rather than rendering disabled error embeds.

---

## ⚠️ Open Bugs

### 2026-10-02 — YouTube and Twitch Alerts Post Nothing on Manual Trigger Check

- **Severity**: 🟠 High (Stream Alerts / User Feedback)
- **Status**: ⚠️ Open
- **Reported issue**: "When YouTube and Twitch alerts are manually triggered, they should retrieve the latest stream or video posted. Currently they post nothing on manual trigger, making it appear as though the feeds are not working at all."

#### Root Cause

1. **Twitch**: The Helix `/streams` endpoint returns active broadcasts only. When a streamer is offline, it can return no items; the poller also requires `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`.
2. **YouTube**: Data API requests can return no items when videos are not publicly available or when `YOUTUBE_API_KEY` is missing or invalid. Public Atom feeds may also fail.
3. Manual checks currently depend on new, unposted items. If no such item is returned, the check can complete silently.

#### Impact

Users cannot tell whether a manual feed check succeeded, and offline Twitch channels or already-delivered YouTube videos may appear to be broken.

#### Expected Behavior

A manual verification check should post the latest available video or broadcast regardless of live status or deduplication state. If no item can be retrieved, the check should provide an actionable status.

#### Proposed Fix and Implementation Steps

1. Pass a force flag from manual polling routes through to the stream alert poller.
2. On a forced check with no new entries, retrieve and deliver the latest available item as a verification post.
3. Provide clear diagnostics when required credentials are missing or no item is available.
4. Add regression tests for already-sent items, offline Twitch channels, and unavailable credentials.
5. Verify with `npm run check` and `npm run build`.

---

## 🛠️ Verification Commands

```bash
npm run check
npm run build
npm test
```

---

## 🔖 Metadata

- **Project**: HELIX Discord Bot · **version** 0.6.0
- **Agent Ecosystem**: [`AGENTS.md`](./AGENTS.md) and [`.agents/`](.agents/) are tracked in the repository.
