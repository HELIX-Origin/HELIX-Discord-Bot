# Free-Tier Heroku 1-Click Deployment Guide

Deploy HELIX Discord Bot and Web Dashboard to Heroku using 100% free-tier eligible resources.

---

## 1. Zero Paid Services Architecture

- **Eco Dyno Allocation**: Uses a single lightweight `web` dyno process (`web: node dist/index.js bot start --port $PORT`).
- **Zero Paid Add-ons**: Does not require Heroku Postgres, Redis, or other paid add-ons. It utilizes the embedded SQLite database engine.
- **Port Binding**: Heroku dynamically assigns `$PORT`, which `BotCallbackServer` automatically parses and binds.

---

## 2. Heroku 1-Click Button

Add this button to your repository README to deploy with one click:

```markdown
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
```

---

## 3. GitHub Secrets Synchronization

The included GitHub Actions workflow (`.github/workflows/heroku-deploy.yml`) automatically pushes your GitHub Secrets to Heroku config variables on every git push:

### Required GitHub Secrets:
1. `HEROKU_API_KEY`: Your Heroku API key from Account Settings.
2. `HEROKU_APP_NAME`: The name of your Heroku application.
3. `DISCORD_BOT_TOKEN`: Discord Bot Token.
4. `DISCORD_CLIENT_ID`: Discord Application Client ID.
5. `DISCORD_CALLBACK_URL`: Public base URL (`https://<app-name>.herokuapp.com`).
6. `NEXTAUTH_URL`: Public base URL (`https://<app-name>.herokuapp.com`).
7. `NEXTAUTH_INTERNAL_URL`: Internal URL (`http://127.0.0.1:5000`).
8. `NEXTAUTH_SECRET`: Secret key for session encryption.

---

## 4. Automated Database Setup (`postdeploy`)

When deploying via the 1-Click button:
- Heroku triggers the `postdeploy` hook declared in `app.json`:
  ```json
  "scripts": {
    "postdeploy": "node scripts/setup.mjs"
  }
  ```
- The setup script automatically initializes `data/helix-bot.sqlite` and builds all schema tables and indices.
- Because environment variables and secrets are already supplied by the 1-Click deployment interface and GitHub Secrets, the setup script **automatically skips interactive prompts** and utilizes the injected configuration directly.

