# 😂 Entertainment & GIF Commands

HELIX Discord Bot includes a suite of entertainment commands powered by the **KLIPY API** — a high-quality GIF service with extensive anime, meme, and reaction categories.

---

## 🎲 GIF Commands

### `/gif` — Random or Categorized GIF
| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `category` | String (autocomplete) | No | GIF category/tag. Autocomplete shows popular tags. |

**Usage**:
- `/gif` — Returns a random GIF from the general pool.
- `/gif category:anime` — Returns a random anime GIF.
- `/gif category:slap` — Returns a slap GIF.

### Popular Categories (Autocomplete)
`anime`, `jojo`, `waifu`, `slap`, `gintama`, `doggo`, `cat`, `hug`, `kiss`, `pat`, `bonk`, `cuddle`, `tickle`, `pet`, `poke`, `baka`, `smug`, `cry`, `angry`, `meme`, `laugh`, `highfive`, `wave`, `wink`, `blush`, `smile`, `dance`, `cringe`, `nom`, `yeet`, `facepalm`, `nod`, `shake`, `bite`, `lick`, `hold`, `spank`, `kill`, `punch`, `stab`, `shoot`

> The full category list is fetched dynamically from KLIPY and presented as Discord autocomplete choices.

---

## ⚡ Action Commands (Convenience Shortcuts)

Each action command maps to its corresponding KLIPY tag internally and optionally mentions a target user.

| Command | KLIPY Tag | Description |
| :--- | :--- | :--- |
| `/slap` | `slap` | Slap a user (or random). |
| `/hug` | `hug` | Hug a user. |
| `/kiss` | `kiss` | Kiss a user. |
| `/pat` | `pat` | Pat a user. |
| `/bonk` | `bonk` | Bonk a user. |
| `/cuddle` | `cuddle` | Cuddle a user. |
| `/tickle` | `tickle` | Tickle a user. |
| `/pet` | `pet` | Pet a user. |
| `/poke` | `poke` | Poke a user. |
| `/baka` | `baka` | Call someone baka. |
| `/smug` | `smug` | Smug reaction. |
| `/cry` | `cry` | Cry reaction. |
| `/angry` | `angry` | Angry reaction. |
| `/meme` | `meme` | Random meme GIF. |

**Usage**:
- `/slap` — Random slap GIF.
- `/slap user:@User` — Slap GIF mentioning @User.
- `/hug user:@Friend` — Hug GIF mentioning @Friend.

---

## 🔧 Configuration

Entertainment commands are gated by the `GIFS_ENABLED` feature flag (default: `true`).

```env
# Disable all GIF/entertainment commands
GIFS_ENABLED=false
```

When disabled:
- Commands are not registered with Discord.
- Dashboard entertainment pages are hidden.

---

## 📡 KLIPY API Integration

- **Endpoint**: `https://klipy-api.vercel.app/api/v1/gif`
- **Authentication**: None required (public API).
- **Rate Limits**: Generous public limits; cached responses reduce upstream calls.
- **Fallback**: If KLIPY is unreachable, commands respond with a friendly error embed.

---

## 🎨 Embed Format

GIF responses use a standardized Discord embed:

```
┌────────────────────────────────────────────┐
│ 😂 Slap                                    │
│ ─────────────────────────────────────────  │
│ @User just got slapped! (via KLIPY)        │
│                                            │
│ [Animated GIF — full width, auto-height]   │
│                                            │
│ Powered by KLIPY  •  Category: slap        │
└────────────────────────────────────────────┘
```

- **Color**: Random vibrant color per response.
- **Footer**: Attribution to KLIPY + category tag.
- **Image**: Full-resolution GIF (KLIPY serves optimized WebP/GIF).

---

## 🛠️ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| "GIF commands not showing" | Ensure `GIFS_ENABLED=true` in `.env` and re-invite bot (slash commands re-register on startup). |
| "KLIPY API error" | Check Service Logs for upstream HTTP errors. KLIPY may have temporary downtime. |
| "Autocomplete not working" | Discord caches autocomplete; wait up to 1 hour or re-invite bot. |
| "GIF doesn't animate" | Discord may render as static if >10MB; KLIPY serves optimized sizes. |

---

## 🔗 Related

- [Discord Bot & Commands](Discord-Bot.md) — Full command reference
- [Configuration → Feature Flags](Configuration.md) — `GIFS_ENABLED` and other flags