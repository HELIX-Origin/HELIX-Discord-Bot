# Rule 06: Discord.js v14 Standards & Modular Command Architecture

**Status**: MANDATORY COMPLIANCE
**Runtime**: `discord.js` `^14.18.0` (Node.js `>=22.9`, TypeScript ESM)

> [!IMPORTANT]
> **These docs are a derived copy of upstream truth, not the source of truth.**
> When this file and Discord disagree, **Discord wins** — fix this file.
> Authoritative sources, re-verified 2026-10-02:
>
> - Application commands: <https://discord.com/developers/docs/interactions/application-commands>
> - Message embeds: <https://discord.com/developers/docs/resources/message#embed-object>
> - discord.js guide: <https://discordjs.guide> (v14 pages now live under `/legacy/` and `/slash-commands/`)
> - discord.js API docs: <https://discord.js.org/docs>
>
> This rule is split into two parts, and the split is the point:
> - **Part A — Discord API invariants.** Authoritative. Cannot be relaxed by us.
> - **Part B — HELIX house style.** Our choices. Changeable, but deliberately.
>
> An earlier revision of this file blurred the two and consequently asserted things
> Discord never said (see §6, "Corrected errors"). Do not repeat that.

---

## 0. Runtime reality (verified)

This is a **hybrid** bot, not a pure discord.js app. Get this right before reasoning about API shape.

| Concern | Implementation | Source |
|---|---|---|
| Gateway / client lifecycle | discord.js `Client` | `src/bot/bot.ts` |
| Command registration to Discord | discord.js `REST` + `Routes` | `src/bot/bot.ts` |
| Intents | discord.js `GatewayIntentBits` | `src/bot/config.ts` |
| Permission bitfields | discord.js `PermissionFlagsBits` | `src/bot/lib/admin/permissions.ts`, all moderation commands |
| Discord object types | discord.js `Guild`, `GuildMember`, `Role`, `Channel`, `Message`, `VoiceState`, `TextChannel` | throughout `src/bot/events/` |
| Interactions | **Hand-rolled** `DiscordInteraction`, `InteractionResponse`, `ApplicationCommand` | `src/bot/utils/types.ts` |
| REST calls | **Hand-rolled** `DiscordRestClient` over Node `http` | `src/bot/rest.ts` |

**Consequence**: we build command definitions as **plain objects**, not
`SlashCommandBuilder`. `SlashCommandBuilder`'s validation and `.toJSON()` do not
exist here, so **all** API limit enforcement is ours to implement (see §2.4).
`InteractionResponseType`/`ApplicationCommandOptionType` in `src/bot/utils/types.ts`
are our own enums mirroring the numeric wire values — always reference the enum,
never the raw number.

---

## 1. Part A — Discord API invariants (authoritative)

### 1.1 Command counts (per scope)

| Scope | `CHAT_INPUT` | `USER` | `MESSAGE` | `PRIMARY_ENTRY_POINT` |
|---|---|---|---|---|
| Global (per application) | **100** | 15 | 15 | 1 |
| Per guild | 100 | 15 | 15 | **not allowed** |

- Names are unique per application, per type, within each scope. A global and a
  guild command **may** share a name; two globals **may not**.
- **Global rate limit: 200 application command creates per day, per guild.**

### 1.2 Command object limits

| Field | Limit |
|---|---|
| `name` | 1–32 chars, must match `^[-_\u02BC\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$` **with the `u` flag**. Where a lowercase variant exists, the lowercase form must be used. |
| `description` | 1–100 chars (`CHAT_INPUT` only; empty string for `USER`/`MESSAGE`) |
| `options` | max **25**; `CHAT_INPUT` only |
| **Combined size** | **8,000 characters** for the combined `name` + `description` + value properties of the command, its options (incl. subcommands/groups), and choices. With localizations present, only the **longest localization** per field counts. |

> Our registry's `validateCommandLimits` (`src/bot/handlers/registry.ts`) enforces a
> **stricter** name regex, `^[a-z0-9_-]{1,32}$`, which is a subset of Discord's and is
> a deliberate house rule (§3.2). That is fine. But the registry does **not** yet enforce
> the 8,000-character budget, choice field lengths, required-before-optional ordering,
> or the autocomplete/`choices` exclusivity — tracked in `BUGS.md`.

### 1.3 Option limits

| Field | Limit |
|---|---|
| `options` count | max 25 |
| option `name` | 1–32 chars, same regex as command names; **must be unique within its array** |
| option `description` | 1–100 chars |
| `choices` | max **25**; `STRING`/`INTEGER`/`NUMBER` only. Choice `name` 1–100 chars; choice `value` ≤100 chars |
| `STRING` `min_length` / `max_length` | 0 – 6000 |
| `INTEGER` | -2^53+1 … 2^53-1 |
| `NUMBER` | -2^53 … 2^53 |
| `file_types` | max 10 |

Hard structural rules Discord rejects:

- **Required options must be listed before optional options.**
- **`autocomplete: true` may not be combined with `choices`.**

### 1.4 Subcommands and groups

- Nesting is supported **one level deep only**: command → group → subcommand.
- If a command defines subcommands or groups, **the bare base command becomes
  unusable** and will not appear on its own.
- `SUB_COMMAND` / `SUB_COMMAND_GROUP` options may not be `required`.

### 1.5 Contexts and permissions

- `contexts` (interaction contexts) replaces the **deprecated** `dm_permission`:
  `GUILD` = `0`, `BOT_DM` = `1`, `PRIVATE_CHANNEL` = `2`. Guild commands do not support `BOT_DM`.
- `integration_types` defines installation contexts. Both apply to **globally-scoped commands only**.
- `default_member_permissions` is a bitwise-OR permission bitfield serialized as a **string**.
  `"0"` means nobody except admins may use the command by default.
- `default_permission` is **not recommended** and will soon be deprecated — prefer
  `default_member_permissions: "0"`.
- Application command **permissions** (per-user/role/channel overrides) can only be
  updated with a **Bearer** token; a bot token will error.
- Max 100 permission overwrites per command.

### 1.6 Registration is HTTP-only

- Commands are registered **only** via HTTP endpoints:
  - Global: `PUT /applications/{app.id}/commands`
  - Guild: `PUT /applications/{app.id}/guilds/{guild.id}/commands`
- `POST` behaves as an **upsert on name**; `PATCH`/`DELETE` address a command by id.
- Guild commands update **instantly** and are the recommended target for development
  and testing. Global commands have read-repair propagation delay.
- Only re-register when a command **definition** changes. Editing an `execute` body
  requires no redeployment.

### 1.7 Embed limits

| Field | Limit |
|---|---|
| title | 256 |
| description | 4096 |
| field name | 256 |
| field value | 1024 |
| fields count | 25 |
| footer text | 2048 |
| author name | 256 |
| **total characters (all components combined)** | **6000** |

Mirrored and clamped in `src/bot/lib/embeds/limits.ts`. Note the 6000-character
combined budget is the one limit that module does **not** currently clamp.

### 1.8 Interaction response basics

- An interaction must be acknowledged within **3 seconds**, or Discord shows
  "This interaction failed". Defer (`InteractionResponseType.DeferredChannelMessageWithSource` = `5`)
  before doing slow work.
- Ephemeral = `MessageFlags.Ephemeral` (`64`). Never write the literal.

---

## 2. Part B — HELIX house style (our choices)

These are **not** Discord requirements. They are our conventions.

### 2.1 Colocation, and when to factor out to `lib/`

Default: a command file is **self-contained** — its options, definition, and handler
all live together, for full visibility.

Factor out into `src/bot/lib/` when either of these applies:

1. **Size management** — the command file would otherwise become unwieldy. A large
   option schema belongs in `src/bot/lib/options/<command>.ts` so the command file
   stays readable.
2. **Shared resources** — the resource is needed by more than one command or feature,
   so extracting it avoids duplication and keeps them in sync. Shared resources go in
   a feature folder (`src/bot/lib/<feature>/`), not `lib/options/`.

These are the two justifications for a shared folder, and both are legitimate. The
boundary is about **what gets shared**, not about keeping files small: option
*schemas* go to `lib/options/<command>.ts`; anything reusable at runtime
(config getters, renderers, senders, component handlers) goes to `lib/<feature>/`.

This applies only to **resources a command consumes**. It never applies to a
command's own execution logic, which stays in the command file (see §3.1).

Current factor-outs: `lib/options/{ticket,welcome}.ts` (size), and the feature
subsystems under `lib/admin/`, `lib/feeds/`, `lib/prefix/` (shared).

### 2.2 Flat actions over subcommands

We prefer a flat `action` option with `choices` over `SUB_COMMAND`/`SUB_COMMAND_GROUP`
trees. Rationale: subcommands make the bare base command unusable (§1.4), add a nesting
level to every handler, and cost registration payload. This is a deliberate trade —
it is not a Discord constraint, and a command whose option set genuinely outgrows a
flat action list should use subcommands instead.

### 2.3 Naming

- Command names: lowercase `a-z`, `0-9`, `_`, `-`, 1–32 chars. Stricter than §1.2 by design.
- File names: kebab-case matching the command (`free-games.ts` → `/free-games`).
- Exported symbols: `<name>Command`, `<name>CommandDef`, `<name>Options`, `handle<Name>Command`.

### 2.4 We own limit enforcement

Because we do not use `SlashCommandBuilder`, `validateCommandLimits` in
`src/bot/handlers/registry.ts` is the **only** thing standing between a bad definition
and a rejected registration. Extend it whenever a §1.2/§1.3 rule is not covered.
`registerCommand` throws on violation — that is intentional, fail fast at load.

### 2.5 Feature gating

Feature flags are **per-guild settings**, not config. Read them with
`isFeatureEnabled(deps, guildId, idOrAlias)` from `src/bot/lib/prefix/features.ts`
(backed by `feature_<name>` guild settings). A feature **family** is gated by its
aggregate key — e.g. all feed types follow `feature_feeds`. `feature_streamalerts`
gates the YouTube/Twitch family. See `src/feed/watcher.ts` for the reference
enforcement point.

### 2.6 Withdrawn commands

Some action commands were **deliberately withdrawn** because they never worked
reliably; they are being replaced by the prefix command system. Their modules must
**not** export a registrable command. `tests/unit/bot/loader.test.ts` pins the
withdrawn set so a well-meaning "discovery is broken" fix fails the gate instead of
resurrecting them. Never add a `BotCommand` to a withdrawn module.

---

## 3. Command file standard (`src/bot/commands/`)

### 3.1 A command file carries commands, and nothing else

This is the load-bearing rule.

**Canonical discord.js shape** is a module exporting exactly two properties:

```js
module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('...'),
  async execute(interaction) { /* ... */ },
};
```

**HELIX equivalent** — a command file exports the command and its colocated parts,
and **nothing else**:

| Export | Purpose |
|---|---|
| `<name>Options` | the option array (§2.1 exception: may live in `lib/options/`) |
| `<name>CommandDef` | the `ApplicationCommand` definition |
| `handle<Name>Command(interaction, deps, rest)` | the handler |
| `<name>Command: BotCommand` | the registrable unit: `{ def, category, execute, ... }` |
| `registerCommandMetadata({...})` | help/dashboard metadata |

Anything a command file needs **that is not part of this command** belongs in
`src/bot/lib/`. Concretely, a command file must **not** export:

- configuration readers / getters (`getTicketConfig`, `getWelcomeConfig`)
- message renderers / template substitution (`renderTicketMessage`, `renderWelcomeMessage`)
- message senders (`sendWelcomeMessage`, `sendTicketButtonMessage`)
- component/button interaction handlers (`handleTicketButton`)
- any helper consumed by a **different** subsystem (events, handlers, dashboard routes)

> [!CAUTION]
> **This is the rule that was being violated.** `commands/admin/ticket.ts` (843 lines)
> and `commands/admin/welcome.ts` (423 lines) were feature *subsystems* living in command
> files. Because non-command code had to reach into them, `events/member.ts`,
> `handlers/commands.ts`, and `dashboard/routes/guilds.ts` all imported from
> `src/bot/commands/`, and `welcome.ts` imported sideways from `ticket.ts`.
> Layering inverts: the dashboard was reaching into a command module for domain logic.
>
> Test `tests/unit/architecture/commandBoundaries.test.ts` enforces this automatically.

### 3.2 Command file requirements

1. **One command per file**, grouped by domain category.
2. **Guild-only validation**: if the command needs a guild, guard `if (!interaction.guild_id)`
   and return a clear ephemeral error.
3. **All responses go through `EmbedHandler.for(deps)`** from
   `src/bot/lib/embeds/builder.js`. Never return raw unbranded embeds, and never
   write magic numbers (`flags: 64` → `.respond(true)`; `type: 4` → the enum).
4. **Audit-log privileged mutations** via `dispatchAuditLog` from `src/bot/lib/admin/auditlog.ts`.
5. **Declare permissions** with `default_member_permissions` using `PermissionFlagsBits`.
   Do **not** add `dm_permission` — it is deprecated (§1.5); use `contexts` instead.
6. **List required options before optional ones** (§1.3). Discord rejects the inverse.

### 3.3 Discovery and dispatch

- `src/bot/handlers/loader.ts` walks `COMMAND_CATEGORIES` under `src/bot/commands/`,
  dynamically imports every module, and registers exports satisfying `isBotCommand()`
  (`{ def, category, execute }`). There is **no static command index**.
- `src/bot/handlers/loader.ts` also routes the `prefix` category into the prefix
  registry instead of the slash registry.
- It warns when a scanned category yields zero registrations, so a dropped category
  can never fail silently again.
- `src/bot/handlers/commands.ts` dispatches `interactionCreate`, and
  `src/bot/handlers/prefix.ts` dispatches `messageCreate` for prefix commands.

### 3.4 Registration

Registration is a **separate concern** from execution. Discord allows it only over
HTTP, and it is rate limited to 200 creates/day/guild, so it must not run on every
`ready`. Guild-scoped registration (instant, ideal for development) and global
registration (production) are distinct operations with distinct routes.

---

## 4. Directory structure (`src/bot/`, actual)

```text
src/bot/
├── bot.ts                    # discord.js Client lifecycle + REST/Routes command registration
├── config.ts                 # GatewayIntentBits, env parsing
├── rest.ts                   # DiscordRestClient (native http, hand-rolled REST)
├── commands/                 # COMMANDS ONLY (Rule 06 §3.1)
│   ├── admin/                # role.ts, voice.ts
│   ├── mod/                  # announce, ban, kick, lock, purge, slowmode, unlock, warn
│   ├── prefix/               # set.ts, help.ts  (prefix system, not slash)
│   ├── utility/              # about.ts, help.ts, stats.ts
│   └── feeds/                # WITHDRAWN action commands — no BotCommand export (Rule 06 §2.6)
├── events/                   # channel, guild-create, member, ready, role, voice-state
├── handlers/                 # commands.ts, events.ts, loader.ts, prefix.ts, registry.ts
├── lib/                      # reusable modules — used by commands AND events
│   ├── admin/                # auditlog.ts, modlog.ts, permissions.ts
│   ├── embeds/               # builder.ts (EmbedHandler), limits.ts, responses.ts, variants.ts
│   ├── feeds/                # notify.ts
│   ├── options/              # ticket.ts, welcome.ts (the §2.1 exception)
│   └── prefix/               # features.ts, parser.ts, settings.ts, types.ts
└── utils/
    ├── types.ts              # Discord interaction/command/option typings, our enums
    └── embeds.ts             # createEmbed, successEmbed, EMBED_COLORS
```

---

## 5. Verification protocol

This rule encodes a **snapshot** of upstream behaviour. It decays.

1. Any claim in **Part A** that you have not verified against the linked docs in this
   session is **unverified** — treat it as suspect, not as law.
2. When changing anything in Part A, re-read the upstream section and update the
   citation date at the top.
3. Never "fix" a code-level violation by editing this file to bless it. Fix the code.
4. House-style changes (Part B) may be made freely, but must not be phrased as if
   Discord required them.

---

## 6. Corrected errors (audit trail)

The pre-2026-10-02 revision of this file asserted the following. All are **false**
and must not be reintroduced:

| False claim | Reality |
|---|---|
| Command definition budget is **4,000** characters | **8,000** (§1.2) |
| Command/option names must match `^[a-z0-9_-]{1,32}$` as an API rule | That is a **house** rule (§2.3). Discord's rule is the Unicode regex in §1.2 |
| "Options over subcommands" is a Discord standard | Not a Discord rule at all — house style (§2.2). Subcommands are fully supported and documented |
| "Options are colocated in the command file" (§3) **and** "modularize options into `lib/options/`" (§1.2) | These contradicted each other. Resolved as colocate-by-default with a narrow exception (§2.1) |
| Only 25 options / 25 choices / 100 commands matter | Also: 15 `USER`, 15 `MESSAGE`, 1 `PRIMARY_ENTRY_POINT`, 200 creates/day/guild, choice field lengths, `min_length`/`max_length` ≤6000, `file_types` ≤10, required-before-optional, autocomplete/choices exclusivity (§1.1, §1.3) |
| Feature flags live at `deps.config.features.<feature>Enabled` | They are per-guild settings read via `isFeatureEnabled()` (§2.5) |
| `commands/registry.ts`, `commands/entertainment/gif.ts`, `commands/admin/set.ts`, `commands/feeds/feed.ts`, `lib/embeds/index.ts`, `utils/klipy.ts`, `events/guildCreate.ts`, `events/voiceStateUpdate.ts` | None of these exist. See the real tree (§4) |
| Runtime is pure discord.js v14 | Hybrid — hand-rolled interactions and REST client (§0) |
