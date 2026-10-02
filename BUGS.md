# 🐛 BUGS
> [!IMPORTANT]
> All known bugs are listed here. Keep in mind, that if a bug is missing, it may not have been discovered or reported yet.
>
> The repository maintainers (and contributors) actively search for new bugs and update this document accordingly. In some cases, a bug will be spotted and fixed without this page being immediately updated. This page is primarily a living index and may not always reflect the most current state of the codebase.
>
> AI agents are strongly advised to update this page first and push it to the remote before working on any new bug fixes or features. This way the remote repository always has the most up-to-date list of known issues.
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
## 🚫 Known quirks & external limitations (wontfix bucket)
- 🐢 **External Feed Throttling & Rate Limits:** Upstream APIs (Reddit, YouTube, Twitch, GamerPower) enforce rate limits. Handlers and background workers throttle requests and implement exponential backoff rather than spam-retrying.
- **Discord API Gateway & Rate Limits:** Discord enforces global and route-specific rate limits on interaction responses, guild command syncs, and embeds. Guild command updates must be debounced.
## 💡 Explicitly not bugs
- Disabled features intentionally hide their corresponding dashboard navigation links and unregister their slash commands from Discord guilds rather than rendering disabled error embeds.
## ⚠️ Open
### 2026-10-02 — YouTube and Twitch Alerts Post Nothing on Manual Trigger Check
- **Severity**: 🟠 High (Stream Alerts / User Feedback)
- **Status**: ⚠️ open
- **Reported Issue**: "When YouTube and Twitch alerts are manually triggered, they should retrieve the latest stream or video posted. Currently they post nothing on manual trigger, making it appear as though the feeds are not working at all."
- **Root Cause**:
  1. **Twitch Implementation Flaws**:
     - Upstream Twitch Helix API (`/helix/streams`) only returns active broadcasts when a streamer is **LIVE**. If the streamer is offline when checked, the API returns zero items. Without querying past broadcasts/VODs (`/helix/videos`) or sending an offline status confirmation, manual checks return nothing.
     - Twitch polling strictly requires `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`. If either environment variable is missing, `fetchTwitchFeed` immediately exits with an empty array.
  2. **YouTube Implementation Flaws**:
     - Upstream YouTube Data API (`/videos` and `/search`) only returns videos that are publicly available. If a video is set to private or unlisted, it will not be retrieved during manual checks.
     - YouTube polling strictly requires a valid `YOUTUBE_API_KEY`. If the environment variable is missing or invalid, `fetchYouTubeFeed` immediately exits with an empty array.
     - Both Twitch and YouTube manual triggers rely on the respective APIs returning data. If the APIs do not return any items due to the reasons mentioned above, the manual trigger will appear to do nothing, even though the system is functioning as designed.
- **Additional Notes**:
  1. **Alert Types**:
    - Twitch and YouTube live alerts are intentionally only supposed to trigger for live broadcasts. YouTube however, supports both live broadcasts and uploaded videos. So YouTube needs to work for both cases.
  2. **Manual Trigger Purpose**:
    - The manual trigger is intended for users to be able to test their integration, so it must always post the latest video or stream regardless of its live status.