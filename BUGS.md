# HELIX Discord Bot — Bug Tracker

> 🐛 **Living Source of Truth**: This page tracks known, unresolved bugs. Resolved or superseded entries are removed; implementation tasks belong in [`TODO.md`](./TODO.md), sprint plans in [`PLAN.md`](./PLAN.md), and long-term milestones in [`ROADMAP.md`](./ROADMAP.md).

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

## ⚠️ Active & Open Bugs

*No open bugs at this time.*

> [!IMPORTANT]
> **Withdrawn action commands are not bugs.** `src/bot/commands/feeds/` and the
> action-style `admin/welcome.ts` and `admin/ticket.ts` intentionally export no
> `BotCommand`, so `/rss`, `/youtube`, `/twitch`, `/free-games`, `/reddit`,
> `/welcome`, and `/ticket` are never registered with Discord. That is the
> project's intent — those action commands were withdrawn because they never
> worked reliably, and the prefix command system (W.13) replaces them. **Do not
> "fix" discovery by adding a `BotCommand` export to those modules.**
> `tests/unit/bot/loader.test.ts` asserts their continued absence.

---

## 🚫 Known Quirks & External Limitations (wontfix bucket)

- 🐢 **External Feed Throttling & Rate Limits:** Upstream APIs (Reddit, YouTube, Twitch, GamerPower) enforce rate limits. Handlers and background workers throttle requests and implement exponential backoff rather than spam-retrying.
- **Discord API Gateway & Rate Limits:** Discord enforces global and route-specific rate limits on interaction responses, guild command syncs, and embeds. Guild command updates must be debounced.

## 💡 Explicitly Not Bugs

- Disabled features intentionally hide their corresponding dashboard navigation links and unregister their slash commands from Discord guilds rather than rendering disabled error embeds.

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
