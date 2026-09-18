# HELIX Discord Bot — Task Checklist & Session Tracking

**Verification gate for every workstream:** `npm run check` + `pnpm build` must both pass before a workstream is considered done.

---

## 🔥 Active Tasks

### Workstream: Guild Admin Dashboard Sections + Thread-Based Ticket System

**Locked user directives:**

- Add missing sections to the Guild Admin tab: welcome channel + message, tickets channel + message, transcripts channel (secure channel for closed-ticket outputs), ticket manager role (auto-added to every opened ticket), log channels (audit + mod).
- Audit log and mod log sections let guild admins choose which events get sent to the channels.
- Welcome and ticket messages support detailed markdown and argument/placeholder handling.
- Ticket system redesign: "the ticket system should open a new thread for the issues. but it should us a text channel for the message. Users simply click a button on the ticket channel message to open a ticket."

**Scratch:**

| Files | Role |
|---|---|
| `src/bot/lib/admin/auditlog.ts` | NEW audit log dispatch (channel + event CSV) |
| `src/bot/lib/admin/modlog.ts` | MOD_ACTIONS + `mod_log_events` CSV filter |
| `src/dashboard/routes/guilds.ts` | GET/PUT settings read/write for welcome, ticket, logs |
| `src/dashboard/views/dashboard/guildadmin.ts` | Welcome / Tickets / Log Channels cards |
| `src/dashboard/views/dashboard/client-script.ts` | loadGuildAdminTab + saveGuildAdmin extensions |
| `src/bot/commands/admin/ticket.ts` | Chat-button → thread redesign |
| `src/bot/commands/admin/welcome.ts`, `set.ts` | audit dispatch wiring |
| `src/bot/rest.ts` | message components / thread start support |

**Implementation checklist:**

- [ ] Extend GET `/api/guilds/:guildId/settings` to return welcome, ticket, and log config
- [ ] Extend PUT `/api/guilds/:guildId/settings` to save welcome/ticket/log fields + audit dispatch + event CSV validation
- [ ] Add Welcome / Tickets / Log Channels cards to `guildadmin.ts` (markdown + placeholder textareas)
- [ ] Extend `client-script.ts` `loadGuildAdminTab` + `saveGuildAdmin` for new fields
- [ ] Wire `dispatchAuditLog` into `welcome.ts`, `ticket.ts`, `set.ts`, and guild settings PUT
- [ ] Redesign ticket system: sticky text-channel button message → new thread per ticket, manager role auto-added
- [ ] `npm run check` + `pnpm build` green
- [ ] Commit + push; sync wiki docs per Rule 05; roadmap issue per Rule 04

---

## 🛠️ Verification Commands

```
npm run check               # typecheck + format:check + lint + tests (must pass)
pnpm build                  # tsc compile to dist/ (must pass)
npm test                    # vitest run
npx prettier --write src    # only when format:check complains
```

---

## 🔖 Metadata

- **Project**: HELIX Discord Bot · **version** 0.5.0
- **Agent Ecosystem:** `AGENTS.md` and `.agents/` are tracked directly in repository git tracking.