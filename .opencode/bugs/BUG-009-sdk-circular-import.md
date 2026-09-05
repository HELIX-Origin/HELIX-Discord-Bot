# BUG-009 — SDK circular import crash

**Status:** Resolved
**Priority:** High
**Area:** `HELIX/src/plugins/sdk/*`
**Remote:** [Parent #23](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/23)

## Resolution

Fixed via leaf-module extraction. `detectLanguageFromPath` + `FALLBACK_EXTENSIONS` moved to
`HELIX/src/plugins/sdk/detect-language.ts` (imports `registry.js` only); `source-resolver.ts`
imports from the leaf and re-exports `detectLanguageFromPath` to preserve the API.
`{github,gitlab,bitbucket}.ts` import from the leaf. `source-resolver.ts` is no longer part of
any cycle, so the top-level `registerBuiltInSourceProviders()` is safe from every entry order.

Coverage: `tests/unit/plugins/sdk/entry-order.test.ts` (3 tests) — provider-first entry, then
resolver-first entry, with built-in registration + end-to-end GitHub resolution asserted.

## Symptoms

`TypeError: registerBuiltInSourceProviders is not a function` at
`HELIX/src/plugins/sdk/source-resolver.ts:23` when the ESM evaluation cycle is
entered through `source-providers/index.js` (or any order where the live binding
is not yet initialised).

## Sub-Tasks (Remote)

1. Diagnostics — [#24](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/24)
2. Core Fix — [#25](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/25)
3. Vitest Suite — [#26](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/26)
4. Verification & Docs — [#27](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/27)

## Notes

- Cycle: `source-resolver.ts → source-providers/index.ts → {github,gitlab,bitbucket,pastebin}.ts → source-resolver.ts` (`detectLanguageFromPath`).
- `sdk/index.ts` re-exports `source-resolver.js`, so the facade is one evaluation-order change away from breakage.
- Existing `source-providers.test.ts` works around the cycle by side-effect importing `source-resolver.js` first.
- Fix candidates: extract registration to a module without the back-edge, or make providers lazy-import, or remove the top-level registration side effect.