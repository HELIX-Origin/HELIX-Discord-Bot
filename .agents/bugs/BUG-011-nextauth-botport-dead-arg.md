# BUG-011 — `getNextAuthConfig({ botPort })` dead argument

**Status:** Resolved
**Priority:** Low
**Area:** `HELIX/src/env.ts` (`getNextAuthUrl`), `HELIX/dashboard/auth/config.ts`
**Remote:** [#32](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/32)

## Resolution

`getNextAuthUrl(customPort)` now treats a local callback base (`DISCORD_CALLBACK_URL` with
localhost/127.0.0.1, or none) as `http://localhost:<customPort>` directly — customPort beats
`PORT`. External callback bases (e.g. `https://myapp.herokuapp.com`) are preserved unchanged.
Tests: `env.test.ts` (customPort vs PORT; external base preserved) and `auth-config.test.ts`
(`getNextAuthConfig({ botPort: 4321 }).url === 'http://localhost:4321'` with `PORT=4000`).

## Follow-up: env-only port contract

Per maintainer decision the `customPort`/`botPort`/`port` override vectors were removed
entirely. The listener (`BotCallbackServer`), `getNextAuthConfig()`, `renderDashboardHtml()`,
and `getNextAuthUrl()`/`getNextAuthInternalUrl()` are now driven exclusively by `PORT` env
(default 5000) so the Discord dev-portal callback URL can never drift from the live port.
`NEXTAUTH_INTERNAL_URL` remains independently configurable via env.

## Symptoms

`getNextAuthUrl(customPort)` sources its localhost fallback from `PORT`
(`getPort()`) via `getCallbackUrl()`, so the dashboard's `botPort` option has no
effect on `config.url` in the common case. `getNextAuthInternalUrl` honours the
port; `getNextAuthUrl` does not — inconsistent.

## Sub-Tasks (Remote)

None (single-part fix).

## Notes

- Desired contract: `getNextAuthConfig({ botPort: 4321 }).url === 'http://localhost:4321'`
  even when `PORT` differs.
- Current tests work around this by setting `PORT`; the fix should change the
  source behavior, not the tests.