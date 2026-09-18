# HELIX Discord Bot — Task Checklist & Session Tracking

**Verification gate for every workstream:** `npm run check` + `pnpm build` must both pass before a workstream is considered done.

---

## 🔥 Active Tasks

### Workstream: Guild Admin Sections, Dedicated Feature Tabs & Permission-Gated Dashboard

**Locked user directives:**

- Guild Admin tab stays for specific/secure configurations; it is not a hiding place for features.
- Existing tabs stay as they are but get a guild-admin access check. New features get their own dedicated tabs with the same check.
- Users with Manage Channels permissions should have access to tabs that set things to channels.
- Guilds page shows all guilds the user is in; invite allowed only with invite permission. Buttons: invite icon + cog icon.
- Guilds page uses pill layout: guild icon left, buttons right.
- Privacy / ToS pages visible without login.
- Commands page requires no login (read-only).
- Ticket system: text channel hosts a button; clicking opens a new thread.

**Implementation checklist:**

- [ ] Relax Discord login (`auth.ts`): allow any Discord user; persist `discord_guilds` (full list w/ permissions)
- [ ] Relax `canUserAccessDashboard` (`shared.ts`) to require only Discord auth; keep `canUserManageGuild`
- [ ] `oauth/discord.ts`: add `hasInvitePermission` helper
- [ ] Rewrite `GET /api/guilds`: merge user guilds + bot guilds → `{id,name,icon,botIn,canManage,canInvite,inviteUrl}`
- [ ] Add `canManage` to `GET /api/guilds/:guildId/channels` response
- [ ] Public `GET /commands` page (no auth) from registry metadata; `robots.txt` allow
- [ ] Rewrite `/guilds` view + in-dashboard guild-selection to pill grid (invite btn + cog btn)
- [ ] `sidebar.ts`: always-visible Commands tab; gate feed/admin sections by `canManage`; add Welcome/Tickets/Logs tabs
- [ ] Split `guildadmin.ts`: keep Roles/Features/Commands/Prefix; new `welcome.ts`/`tickets.ts`/`logs.ts` tabs with per-tab save
- [ ] `client-script.ts`: pill grid, sidebar gating, `loadCommandsTab`, per-tab load/save, relaxed 403 handling
- [ ] `dashboard.ts`: render new tab panes; pass `canManage` to sidebar
- [ ] Ticket redesign: sticky text-channel button message → thread per ticket, manager role auto-added (`ticket_channel_id` key)
- [ ] `npm run check` + `pnpm build` green
- [ ] Commit + push; sync `PLAN.md`/`TODO.md`/`BUGS.md`, `wiki/`, roadmap issue #27 per Rule 04/05

**Status:** server-side access relaxation, guilds API, public commands page, pill-grid views, sidebar/tab split, client scripting, ticket redesign — all pending. Progress mirrored on roadmap issue #27.

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