# HELIX Discord Bot — Current Session Plan

> 🏷️ **Tracking**: Session/roadmap planning companion to `TODO.md` (task checklist) and `BUGS.md` (bug & issue tracker).

---

## 🎯 Active Plan

### Goal — Guild Admin Dashboard Sections + Thread-Based Ticket System

Complete the Guild Admin dashboard tab with the missing server-administration sections, and redesign the ticket system to be button-based with text-channel threads.

**Locked user directives** (do not re-litigate):

- Dashboard Guild Admin tab must gain configurable sections for: welcome channel + message, tickets channel + message, transcripts channel (outputs of closed tickets), ticket manager role (auto-added to every opened ticket), and log channels (audit log + mod log).
- Audit log and mod log sections must let guild admins choose which events get sent to the channels (event CSV selection).
- Welcome and ticket messages must support detailed markdown + placeholder handling (`{user}`, `{server}`, `{membercount}`, `{mention}`; ticket message placeholders as established).
- Ticket system redesign: "the ticket system should open a new thread for the issues. but it should us a text channel for the message. Users simply click a button on the ticket channel message to open a ticket."

### Implementation Plan

1. **Logging libs**: `auditlog.ts` (new — `audit_log_channel_id` + `audit_log_events` CSV, event types settings/welcome/tickets/feeds) and `modlog.ts` (added `MOD_ACTIONS` + `mod_log_events` CSV filter). *Done.*
2. **Guild settings API**: extend GET/PUT `/api/guilds/:guildId/settings` to read/write welcome, ticket, audit-log, and mod-log fields (with role/channel/event validation).
3. **Audit dispatch wiring**: dispatch audit entries from `welcome`, `ticket`, `set`, and guild settings PUT handlers.
4. **Guild Admin UI**: add Welcome, Tickets, Log Channels cards to `guildadmin.ts` (markdown + placeholder-aware textareas) and extend `loadGuildAdminTab` + `saveGuildAdmin` in `client-script.ts`.
5. **Ticket redesign**: ticket channel (text) hosts a sticky button message; clicking creates a new thread in that channel per configured welcome message and adds the ticket manager role.

### Files likely touched

- `src/bot/lib/admin/auditlog.ts` (new), `src/bot/lib/admin/modlog.ts`
- `src/dashboard/routes/guilds.ts`
- `src/dashboard/views/dashboard/guildadmin.ts`, `src/dashboard/views/dashboard/client-script.ts`
- `src/bot/commands/admin/ticket.ts`, `src/bot/commands/admin/welcome.ts`, `src/bot/commands/admin/set.ts`
- `src/bot/rest.ts` (button/component + thread start support if needed)

---

## 🔖 Metadata

- **Project**: HELIX Discord Bot · **version** 0.5.0
- **Repos**: `HELIX-Discord-Bot`.