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

### 🟠 BUG-001 — Slash commands missing from Discord: seven modules export no `BotCommand`

- **Status**: ⚠️ **open**
- **Severity**: 🟠 High
- **Discovered**: 2026-10-02, via the new `tests/unit/bot/loader.test.ts` (W.13 Phase 1)
- **Area**: `src/bot/commands/**`, `src/bot/handlers/loader.ts`

#### Description

`loadAllCommands()` discovers commands by importing every module under
`src/bot/commands/<category>/` and registering each export that satisfies
`isBotCommand()` — an object carrying `{ def, category, execute }`.

Seven modules export only a `*CommandDef` (`ApplicationCommand`) plus a free
`handle*Command()` function, and never wrap them into a `BotCommand`:

| Module | Missing slash command |
| --- | --- |
| `src/bot/commands/feeds/rss.ts` | `/rss` |
| `src/bot/commands/feeds/youtube.ts` | `/youtube` |
| `src/bot/commands/feeds/twitch.ts` | `/twitch` |
| `src/bot/commands/feeds/free-games.ts` | `/free-games` |
| `src/bot/commands/feeds/reddit.ts` | `/reddit` |
| `src/bot/commands/admin/welcome.ts` | `/welcome` |
| `src/bot/commands/admin/ticket.ts` | `/tickets` |

They are therefore never registered with the Discord API, never appear in the
dashboard command reference, and always report as unknown interactions.
Feed management is still reachable through the web dashboard, which is why the
gap went unnoticed.

A second, compounding factor: `COMMAND_CATEGORIES` in `src/bot/handlers/loader.ts`
omitted `'feeds'` entirely, so the whole directory was never even scanned.

#### Reproduction

1. Start the bot and let it sync guild commands.
2. Type `/rss` in a guild — Discord reports "Unknown command".
3. Compare against `getAllCommands()` in a REPL: 13 commands are registered,
   none of them from `feeds/`.

#### Fix

1. ~~Add `'feeds'` to `COMMAND_CATEGORIES`.~~ **Done** in W.13 Phase 1
   (`019685a`+ lineage), alongside a `console.warn` when a scanned category
   yields zero registrations so this class of gap can never be silent again.
2. Add a `export const <name>Command: BotCommand = { def, category, execute }`
   to each of the seven modules, mirroring `src/bot/commands/admin/role.ts`.
3. Add a `loader.test.ts` assertion that each command file in the tree is
   either registered or explicitly allow-listed, so a new module cannot silently
   opt out of registration.

**Estimate**: ~1 hour (7 mechanical module edits + regression test).

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
