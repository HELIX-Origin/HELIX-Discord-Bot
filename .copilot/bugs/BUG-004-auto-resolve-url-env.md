# BUG-004: Auto-resolve NEXTAUTH_URL and Callback URLs

## Metadata
- **Bug ID**: BUG-004
- **Priority**: Medium
- **Status**: Resolved
- **Target Phase**: Phase 7
- **Component**: `src/env.ts`

## Description
`DISCORD_CALLBACK_URL` and `NEXTAUTH_URL` were required in `.env` but can be auto-resolved from platform environment variables.

## Resolution
`getCallbackUrl()` and `getNextAuthUrl()` in `src/env.ts` now detect the public URL from platform env vars in order:
1. `HEROKU_APP_DEFAULT_DOMAIN_NAME` / `HEROKU_APP_NAME`
2. `RENDER_EXTERNAL_URL`
3. `RAILWAY_STATIC_URL`
4. `DOMAIN`
5. Falls back to `http://localhost:<PORT>`

`getNextAuthInternalUrl()` always returns `http://localhost:<PORT>` — never needs a manual env var.

`DISCORD_CALLBACK_URL` and `NEXTAUTH_URL` are now optional overrides in `.env.example`.
