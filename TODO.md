# HELIX Discord Bot — Task Checklist & Session Tracking

**Verification gate for every workstream:** `npm run check` + `pnpm build` must both pass before a workstream is considered done.

---

## 🔥 Active Tasks

*None currently.*

When a workstream starts, list its locked user directives (do not re-litigate), scope tables, and implementation checklist here. Checked-off items roll out of the list as the work ships.

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