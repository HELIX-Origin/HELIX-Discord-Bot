# Bug Report: BUG-003 Heroku deployment fails to auto-detect dynamic app URLs and bot invite URL

## Metadata
- **Bug ID**: BUG-003
- **Status**: Resolved
- **Priority**: High
- **Component**: Deployment / Bot / CI-CD
- **Reported Date**: 2026-09-04
- **Target Resolution**: Phase 6
- **Resolved Date**: 2026-09-04
- **GitHub Issue**: [#3](https://github.com/HELIX-Origin/HELIX-CLI/issues/3)

---

## Description
When deploying HELIX CLI's companion Discord Bot to Heroku (via Heroku 1-Click Button or CI/CD), the deployment required `NEXTAUTH_URL`, `DISCORD_CALLBACK_URL`, and `NEXT_PUBLIC_INVITE_URL` to be supplied before the application existed. Because the Heroku application URL (`https://<app-name>.herokuapp.com`) is only assigned upon creation, users were forced to guess or manually edit variables post-deployment. Furthermore, `app.json` defaulted `NEXT_PUBLIC_INVITE_URL` to a placeholder containing `yourclientid`, and secrets sync from local `.env` could push `http://localhost:5000` to remote Heroku config vars.

## Steps to Reproduce
1. Click the 'Deploy to Heroku' button or trigger Heroku deployment prior to app provisioning.
2. Observe fields in `app.json` requesting `NEXTAUTH_URL`, `DISCORD_CALLBACK_URL`, and `NEXT_PUBLIC_INVITE_URL`.
3. Notice that `NEXT_PUBLIC_INVITE_URL` populated with placeholder `yourclientid`.
4. Note that callback and NextAuth URLs pointed to localhost when synced from local development environment.

## Expected Behavior
- Heroku deployment should automatically detect `HEROKU_APP_NAME` and `HEROKU_APP_DEFAULT_DOMAIN_NAME`.
- `NEXTAUTH_URL` and `DISCORD_CALLBACK_URL` should dynamically resolve to `https://<app-name>.herokuapp.com` when running on Heroku without manual configuration.
- `NEXT_PUBLIC_INVITE_URL` should be automatically generated using the configured `DISCORD_CLIENT_ID` and live callback URL.

## Actual Behavior
- Required manual entry of non-existent URLs on Heroku 1-Click form.
- Hardcoded placeholder client ID in `app.json`.
- Localhost callback URLs transferred to Heroku environment.

## Environment Details
- **OS**: Windows / Linux / macOS
- **Node.js Version**: v22.x LTS
- **HELIX CLI Version**: 0.1.0

## Root Cause Analysis
1. `app.json` lacked `HEROKU_APP_NAME` auto-injection and contained a static placeholder value for `NEXT_PUBLIC_INVITE_URL`.
2. `bot/src/env.ts` only checked for explicit `DISCORD_CALLBACK_URL` and `NEXTAUTH_URL`, falling back to `http://localhost:5000` rather than inspecting Heroku dyno metadata or app name.
3. `.github/workflows/heroku-deploy.yml` directly mapped secrets from GitHub Secrets to Heroku config without transforming localhost URLs into the target Heroku app URL.

## Resolution & Fix
1. Injected `HEROKU_APP_NAME` in `app.json` and updated descriptions so URL fields are optional and auto-detected.
2. Implemented `getHerokuAppUrl()` in `bot/src/env.ts` to inspect `HEROKU_APP_DEFAULT_DOMAIN_NAME`, `HEROKU_APP_NAME`, and dyno environment.
3. Updated `getCallbackUrl()`, `getNextAuthUrl()`, and `getInviteUrl()` to automatically build live Heroku URLs and Administrator bot invite links.
4. Added dynamic URL derivation and `runtime-dyno-metadata` enablement in `.github/workflows/heroku-deploy.yml`.
5. Updated `scripts/setup.mjs` to auto-detect and log the Heroku host environment.
6. Added automated unit tests in `tests/unit/bot-invite.test.ts` (64/64 tests passing).
