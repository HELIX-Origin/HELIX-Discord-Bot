# BUG-010 — `getUserActiveTicket` nondeterministic ordering

**Status:** Resolved
**Priority:** Medium
**Area:** `HELIX/src/db/database.ts:327`
**Remote:** [Parent #28](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/28)

## Symptoms

`getUserActiveTicket` runs `... AND status = 'open' LIMIT 1` with no `ORDER BY`,
so the returned ticket is undefined when a user has multiple open tickets. Every
other lookup in the file orders by `id DESC` / `updated_at DESC`.

## Sub-Tasks (Remote)

1. Core Patch — [#29](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/29)
2. Vitest Suite — [#30](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/30)
3. Verification & Docs — [#31](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/31)

## Notes

- Fix direction: `ORDER BY id DESC LIMIT 1` (newest open ticket wins).