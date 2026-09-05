# BUG-013 — Discord Gateway DisallowedIntents crash & OAuth2 invite redirect_uri error

**Status:** Resolved
**Priority:** High
**Area:** `HELIX/src/client.ts`, `HELIX/index.ts`, `HELIX/dashboard/router.ts`, `HELIX/src/env.ts`
**Remote:** [#34](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues/34)

---

## Symptoms

1. **Gateway Connection Crash (`DisallowedIntents`)**:
   When `client.login(token)` requested `MessageContent` privileged intent without it being enabled under Discord Developer Portal -> Bot -> Privileged Gateway Intents, Discord rejected the connection with error `[DisallowedIntents]`. This previously aborted bot login, leaving the bot Offline in Discord and displaying "Connecting..." / "Gateway: Offline" on the live web dashboard.

2. **OAuth2 Redirect URI Rejection in `/invite`**:
   The `/invite` route forced `&redirect_uri=${callbackUrl}&response_type=code` onto standard bot invite links. If the exact callback URL was not whitelisted in the developer portal under OAuth2 -> Redirects, Discord rejected the invite with `Invalid OAuth2 redirect_uri`.

3. **Hosting Environment Variable Aliases**:
   Hosting providers (Render, Heroku, Railway) or `.env` files using alternative naming conventions (`BOT_TOKEN`, `CLIENT_ID`, `APPLICATION_ID`) could fail to resolve.

---

## Resolution

- **Gateway Intent Fallback Resilience**:
  - `createBot(privileged = true)` in `HELIX/src/client.ts` supports non-privileged standard intents (`[GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]`).
  - `launchBotAndDashboard()` in `HELIX/index.ts` catches `DisallowedIntents` during `client.login(token)` and automatically falls back to standard intents. The bot client comes **Online** immediately in Discord, registers global slash commands, and outputs guidance for enabling prefix commands.
- **Clean Invite URL Generation**:
  - `HELIX/dashboard/router.ts` (`/invite`) generates standard bot invite URLs without forcing `redirect_uri` or `response_type=code` unless explicitly requested.
- **Environment Variable Aliases**:
  - `HELIX/src/env.ts` updated with broad alias resolution for `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `DISCORD_CLIENT_SECRET`.
- **Testing**:
  - Updated `tests/unit/dashboard/router.test.ts`. Full Vitest suite passes (33 files, 279 tests).
- **Commit Reference**: `285340e`
