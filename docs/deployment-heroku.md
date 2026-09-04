# Heroku Deployment

Free-tier eligible. Uses a single Eco Dyno with the embedded SQLite database — no paid add-ons required.

---

## 1-Click Deploy

Click the **Deploy to Heroku** button in the README to launch the app wizard. The wizard prompts for your credentials directly; no local setup needed.

After deployment Heroku sets `HEROKU_APP_DEFAULT_DOMAIN_NAME` and `HEROKU_APP_NAME` automatically. HELIX reads these to resolve `NEXTAUTH_URL` and `DISCORD_CALLBACK_URL` — you do not need to set those manually.

---

## Required Config Vars

Set these in the Heroku app wizard or under **Settings → Config Vars**:

| Variable | Value |
|----------|-------|
| `DISCORD_TOKEN` | Bot token |
| `DISCORD_CLIENT_ID` | Application client ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 client secret |
| `NEXTAUTH_SECRET` | Random 32+ character string |

`PORT` is set by Heroku automatically. Everything else is auto-resolved.

---

## GitHub Actions Auto-Deploy

The included `.github/workflows/heroku-deploy.yml` syncs GitHub Secrets to Heroku config vars on every push to `main`. Add these GitHub Secrets to your repo:

- `HEROKU_API_KEY` — from Heroku Account Settings
- `HEROKU_APP_NAME` — your Heroku app name
- `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `NEXTAUTH_SECRET`

---

## Database

`BotDatabase` creates `data/helix-bot.sqlite` and runs all schema migrations on boot. No setup command, no add-ons. Note that Heroku Eco Dynos have an ephemeral filesystem — the SQLite file is lost on dyno restart. For persistence on Heroku, mount an external volume or use `DISCORD_DB_PATH` to point to a persistent store.
