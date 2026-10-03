# Skill: Discord.js v14 Engineering & Modular Architecture

## Overview

Operational reference for building Discord interactions in the **HELIX Discord Bot**.

> [!IMPORTANT]
> This skill is a **derived summary**. Rule 06 (`discord-js-standards.md`) holds the
> authoritative Part A invariants with citations; Discord's own docs outrank both.
> Anything here that contradicts Discord or Rule 06 Part A is a bug in this file.

The bot is a **hybrid**: discord.js `^14.18.0` provides the `Client`, `REST`/`Routes`,
`GatewayIntentBits`, `PermissionFlagsBits`, and Discord object types; interactions and
REST calls are hand-rolled (`src/bot/utils/types.ts`, `src/bot/rest.ts`). See Rule 06 §0.

---

## 1. Command structure

### The rule that matters

A command file carries **commands and nothing else**. Canonical discord.js exports
`{ data, execute }`; HELIX exports `<name>Options`, `<name>CommandDef`,
`handle<Name>Command`, `<name>Command: BotCommand`, and `registerCommandMetadata(...)`.

Anything else a command needs lives in `src/bot/lib/`:

| Must NOT be exported from a command file | Belongs in |
|---|---|
| config getters (`getTicketConfig`) | `src/bot/lib/<feature>/` |
| renderers / template substitution | `src/bot/lib/<feature>/` |
| message senders | `src/bot/lib/<feature>/` |
| button/component handlers | `src/bot/lib/<feature>/` |
| anything another subsystem (events, handlers, dashboard) consumes | `src/bot/lib/<feature>/` |

Enforced by `tests/unit/architecture/commandBoundaries.test.ts`. See the worked example
of why in Rule 06 §3.1.

### Options

- **Colocated by default.** Options, definition, and handler live together for visibility.
- **Narrow exception**: genuinely large schemas factor out to
  `src/bot/lib/options/<command>.ts` (`ticket.ts`, `welcome.ts`).
- **Flat `action` + `choices` over subcommands** — house style, not a Discord rule.
  Subcommands are valid but make the bare base command unusable and add a nesting level.
- Options arrays may be `const` (not exported) when used only by their own file.

### Limits you must respect

Authoritative values live in Rule 06 §1.2–§1.3. The ones that bite most:

- ≤25 options per command; **required before optional**; option names unique
- ≤25 choices per option; choice `name` 1–100 chars, `value` ≤100 chars
- `autocomplete: true` **cannot** be combined with `choices`
- Combined `name` + `description` + values budget is **8,000 characters** (not 4,000)
- `STRING` `min_length`/`max_length` cap at 6,000

Because we bypass `SlashCommandBuilder`, `validateCommandLimits` in
`src/bot/handlers/registry.ts` is the only enforcement point. `registerCommand` throws
on violation — that is deliberate.

---

## 2. Shared libraries (`src/bot/lib/`)

| Module | Contents | Consumers |
|---|---|---|
| `lib/embeds/` | `EmbedHandler` fluent builder, `limits.ts` clampers, `responses.ts` factories, `variants.ts` styles | commands, events, dashboard |
| `lib/admin/` | `auditlog.ts`, `modlog.ts`, `permissions.ts` (role hierarchy, bitfields) | moderation commands, guild events |
| `lib/feeds/` | `notify.ts` formatting + channel dispatch | feed delivery, watchers |
| `lib/options/` | Large option schemas (`ticket.ts`, `welcome.ts`) | command files |
| `lib/prefix/` | `features.ts`, `parser.ts`, `settings.ts`, `types.ts` | prefix command system |

Direction of dependency is strictly one-way:

```text
commands/  ─┐
events/     ─┼─▶  lib/  ──▶  utils/  ──▶  discord.js
handlers/   ─┘
dashboard/  ─┘
```

`dashboard/`, `events/`, and `handlers/` importing from `commands/` is the violation
this rule exists to prevent.

---

## 3. Response and embed guidelines

1. **Never write magic numbers.**
   - `flags: 64` → `.respond(true)` or `MessageFlags.Ephemeral`
   - `type: 4` → `InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE`
   - Permission bits → `PermissionFlagsBits`

2. **Ephemeral vs public.**
   - Ephemeral: admin errors, validation failures, sensitive diagnostics, anything
     that should not persist in a channel.
   - Public: announcements, syndication posts, informational output.

3. **Always build embeds with `EmbedHandler.for(deps)`** — it applies branding, colors,
   and limit clamping. Raw embed literals bypass the clamps and invite 400s.

4. **Acknowledge within 3 seconds.** For slow work, defer (`InteractionResponseType`
   `DeferredChannelMessageWithSource`) before awaiting, then follow up.

5. **Preferred resource pattern for reused embeds**: put a builder factory in
   `lib/embeds/` (e.g. a `feedback(...)` helper), and let commands supply only the
   variable data — rather than copy-pasting embed shapes across handlers.

---

## 4. Feature gating

Feature flags are **per-guild settings**, not config:

```ts
import { isFeatureEnabled } from '../../lib/prefix/features.js';

if (!isFeatureEnabled(deps, guildId, 'feeds')) { /* ... */ }
```

Backed by `feature_<name>` guild settings. A feature **family** follows its aggregate
key (`feature_feeds` gates all feed types; `feature_streamalerts` gates YouTube/Twitch).
`src/feed/watcher.ts` is the reference enforcement point.

---

## 5. Registration

- HTTP-only. `PUT /applications/{id}/commands` (global) or
  `PUT /applications/{id}/guilds/{guild.id}/commands` (guild).
- Guild-scoped updates apply **instantly** — use for development. Global has propagation delay.
- Only re-register when a **definition** changes, never for `execute`-body edits.
- Rate limited to **200 application command creates per day, per guild** — do not
  register on every `ready`.
- See Rule 06 §3.3–§3.4 for our discovery/dispatch wiring.
