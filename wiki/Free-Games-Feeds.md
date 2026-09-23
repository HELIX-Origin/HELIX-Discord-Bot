# 🎮 Free Games & Giveaways Feeds

HELIX Discord Bot includes a multi-platform giveaway and promotion engine that automatically tracks and announces 100% free PC and console games across all major digital game distribution platforms.

---

## 🏬 Supported Platforms & Storefronts

The Free Games engine integrates with the official **Epic Games Store Promotions API** as well as the **GamerPower Open API** to fetch active, time-limited 100% discount deals.

| Platform Key | Display Name | Source Integration | Author / Storefront Branding Icon |
| :--- | :--- | :--- | :--- |
| `epic` | Epic Games Store | Epic Games API + GamerPower | Epic Games Logo |
| `steam` | Steam | GamerPower API | Valve Steam Logo |
| `gog` | GOG.com | GamerPower API | GOG Galaxy Logo |
| `indiegala` | IndieGala | GamerPower API | IndieGala Logo |
| `humble` | Humble Bundle | GamerPower API | Humble Bundle Logo |
| `itchio` | Itch.io | GamerPower API | Itch.io Logo |
| `ubisoft` | Ubisoft Connect | GamerPower API | Ubisoft Connect Logo |
| `ea` | EA App / Origin | GamerPower API | Electronic Arts / EA App Logo |
| `prime` | Prime Gaming | GamerPower API | Amazon Prime Gaming Logo |
| `battlenet` | Battle.net | GamerPower API | Blizzard Battle.net Logo |
| `all` | All Platforms Combined | Unified Aggregator | HELIX Discord Bot Controller Icon |

---

## ⏰ Polling Schedule & Delivery Mechanism

### 1. Daily Automated Polling
Free game giveaways are often time-limited, so HELIX Discord Bot polls active `freegames` feeds **daily** instead of only once a week.
- The background feed watcher inspects active `freegames` feeds on a daily schedule.
- Only genuinely new giveaways are announced; duplicates are suppressed by the composite deduplication engine.
- **Single-Newest-Game Delivery & Rate-Limit Shield**: Each polling cycle delivers strictly the single newest free game giveaway and drains older backlog items as sent, completely protecting your Discord channels from 10+ game burst dumps and rate limits.

---

## 🎨 Embed Appearance & Metadata Extraction

Each free game notification is formatted as a rich Discord embed:
- **Title**: Game Name + Original Worth / Discount (e.g., `🎮 DEATH STRANDING (Free - 100% off, was $39.99)`).
- **Author Tag**: Storefront Name + Storefront Logo Icon (e.g., `Epic Games Store` with official Epic Games icon).
- **Description**: Game synopsis and expiration countdown / claiming deadline.
- **Fields**:
  - `Platforms`: Windows, Mac, Linux, Steam Deck compatibility.
  - `Original Price`: Formatted currency (e.g., `$29.99 USD`).
  - `Giveaway Type`: 100% Free to Keep / DRM-Free / Key Giveaway.
  - `Store URL`: Direct store redemption button link.
- **Banner Image**: High-resolution store key art / promo banner.
- **Embed Color**: Matches storefront color theme (e.g., `#0078F2` for Epic, `#171A21` for Steam, `#9B51E0` for GOG).

---

## 🛠️ Setting Up a Free Games Feed

### Via Dashboard
1. Open the Web Dashboard and navigate to the **Free Games** tab.
2. Select your target **Discord Channel** from the dropdown.
3. Choose your desired **Platform Filter** (`All Platforms`, `Epic Games Store`, `Steam`, etc.).
4. (Optional) Set role mentions (e.g. `@FreeGameAlerts`).
5. Click **Add Free Games Feed**.

### Via Slash Command
```
/free-games enable [channel:#free-games]
/free-games check
/free-games status
/free-games disable
```

---

## ⚡ Immediate / Manual Giveaway Checks

You don't have to wait for the daily scheduled pass to discover new drops:
- **Discord Bot**: Run `/free-games check` in your server to trigger an instant giveaway search.
- **Dashboard**: Click **Check Now** in the Free Games Drops header or **Check Feeds & Alerts Now** on the Overview tab.

---

## ⚙️ Configuration & Customization

The Free Games engine behavior can be customized via `.env`:

```env
# Minimum original retail price (in USD) to announce (0 = announce all giveaways)
FREE_GAMES_MIN_PRICE=0

# Allow DLCs and in-game loot giveaways (true/false)
FREE_GAMES_INCLUDE_LOOT=false
```
