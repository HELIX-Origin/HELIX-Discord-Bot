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

### 🟡 BUG-002 — Command definitions use the deprecated `dm_permission` field

- **Status**: ⚠️ **open**
- **Severity**: 🟡 Medium
- **Discovered**: 2026-10-02, via a Rule 06 audit against Discord's current application-command docs
- **Area**: 12 command files under `src/bot/commands/`

#### Description

Every guild-scoped command sets `dm_permission: false`. Discord's documentation
now marks this field **deprecated** — "Indicates whether the command is available
in DMs with the app, only for globally-scoped commands. By default, commands are
visible." The replacement is the `contexts` field (`GUILD` = `0`, `BOT_DM` = `1`,
`PRIVATE_CHANNEL` = `2`), which applies to globally-scoped commands only.

It is currently harmless-but-wrong: every one of these commands sets
`default_member_permissions` to a non-admin bitfield, so it is guild-only by
permission already. But the field is on a deprecation path and our
`ApplicationCommand` type still models it.

#### Affected files

`admin/{role,voice,welcome,ticket}.ts`, `mod/{announce,ban,kick,lock,purge,slowmode,unlock,warn}.ts`,
plus the `dm_permission?: boolean` field in `src/bot/utils/types.ts`.

#### Fix

1. Remove `dm_permission` from all 12 command definitions.
2. Remove `dm_permission?: boolean` from the `ApplicationCommand` type.
3. Where DM visibility is genuinely wanted, add an explicit
   `contexts: [InteractionContextType.Guild]` / `BotDm` array instead.
4. Extend `validateCommandLimits` to reject `dm_permission` so it cannot return.

**Estimate**: ~30 min (mechanical, plus 4 tests asserting guild-only behaviour).

---

### 🟡 BUG-003 — `validateCommandLimits` misses most Discord command limits

- **Status**: ⚠️ **open**
- **Severity**: 🟡 Medium
- **Discovered**: 2026-10-02, same Rule 06 audit
- **Area**: `src/bot/handlers/registry.ts`

#### Description

We build command definitions as plain objects rather than through
`SlashCommandBuilder`, so `validateCommandLimits` is the **only** thing standing
between a malformed definition and a rejected registration. It currently checks
name format, description length, option count, option name format, option
description length, and choice count.

It does **not** check these documented Discord rules:

| Missing rule | Consequence if violated |
|---|---|
| Combined 8,000-character budget across name/description/values/choices | Silent registration failure at deploy time |
| Required options must precede optional options | Registration failure |
| `autocomplete: true` is incompatible with `choices` | Registration failure |
| Option `name` must be unique within its array | Registration failure |
| Choice `name` 1–100 chars, choice `value` ≤100 chars | Registration failure |
| `STRING` `min_length`/`max_length` ≤ 6000 | Registration failure |
| `default_member_permissions` must be a valid permission bitfield string | Registration failure |
| Total registered commands ≤ 100 per application | Deployment overflow |

Note the audit corrected a long-standing documentation error: the combined budget
is **8,000** characters, not the 4,000 previously asserted in Rule 06.

#### Fix

1. Add each check above to `validateCommandLimits`, throwing with the offending
   command/option named.
2. Add a combined-size walker over the definition and its choices.
3. Add unit tests for each rule, including a passing control case.

**Estimate**: ~2h (validation logic + ~10 test cases).

---

> [!IMPORTANT]
> **Withdrawn action commands are not bugs.** `src/bot/commands/feeds/` and the
> action-style `admin/welcome.ts` and `admin/ticket.ts` intentionally export no
> `BotCommand`, so `/rss`, `/youtube`, `/twitch`, `/free-games`, `/reddit`,
> `/welcome`, and `/ticket` are never registered with Discord. That is the
> project's intent — those action commands were withdrawn because they never
> worked reliably, and the prefix command system (W.13) replaces them. **Do not
> "fix" discovery by adding a `BotCommand` export to those modules.**
> `tests/unit/bot/loader.test.ts` asserts their continued absence.
>
> Separately, those modules are a **layering violation** (Rule 06 §3.1): they export
> feature subsystems — config getters, renderers, senders, a button handler — which
> `events/member.ts`, `handlers/commands.ts`, and `dashboard/routes/guilds.ts` all
> import from. `welcome.ts` even imports sideways from `ticket.ts`. Tracked as a
> workstream in [`TODO.md`](./TODO.md), not here.

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
