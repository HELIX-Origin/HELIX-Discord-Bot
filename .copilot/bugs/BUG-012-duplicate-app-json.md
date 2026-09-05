# BUG-012 — Duplicate `app.json`

**Status:** Resolved
**Priority:** Low
**Area:** Heroku one-click deploy metadata
**Remote:** [#33](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/33)

## Resolution

Maintainer decision: `.github/app.json` is not a supported hiding location for deploy manifests
(Heroku reads only the root `/app.json`). Kept `/app.json` as the single source of truth and
deleted `/.github/app.json`. Verified nothing referenced the `.github` copy.

## Symptoms

`/app.json` and `/.github/app.json` are byte-identical duplicates. Heroku only
reads the root manifest, so the `.github` copy drifts silently (logo URL, env
vars, addons).

## Sub-Tasks (Remote)

None (single-part fix).

## Notes

- Fix direction: keep `/app.json`, delete `/.github/app.json`, or add an
  identical-copy CI check if both are intentional.
- Verified byte-identical with `fc /b`.