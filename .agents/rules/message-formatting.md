# Rule 03: Centralized Message & Discord Embed Standards

## Mandatory Invariants

1. **Direct Bot Channel & Forum Delivery (No Webhooks)**:
   - HELIX delivers all feed items, stream alerts, and bot responses directly via the Discord Bot client (`bot.sendChannelMessage`, `bot.createForumThread`, or slash command interaction replies).
   - Webhook URL delivery is deprecated and retired.

2. **Single Source of Truth for Embed Construction**:
   - Bot interaction responses must use the unified `EmbedHandler` (`src/bot/lib/embeds/builder.ts`) with appropriate semantic variants:
     - `success()`: Action confirmed (`#10b981` Emerald green)
     - `error()`: Operation failed (`#ef4444` Crimson red)
     - `warning()`: Alert / caution (`#f59e0b` Amber yellow)
     - `info()`: Diagnostics / status (`#3b82f6` Royal blue)
     - `feed()`: Feed syndicate item (`#6366f1` Indigo)
   - Feed embeds (`src/bot/utils/embeds.ts`) format: `title`, `url`, `description`, `author`, `publishedAt`, `imageUrl`, and brand icons.

3. **Discord Character Limit Clamping**:
   - All text fields must be strictly clamped before submission to Discord:
     - Title: max 256 characters (`clampTitle`)
     - Description: max 4096 characters (`clampDescription`)
     - Field name: max 256 characters (`clampFieldName`)
     - Field value: max 1024 characters (`clampFieldValue`)
     - Total embed characters: max 6000 characters
     - Max fields per embed: 25

4. **Category-Based Delivery Routing**:
   - Feed target resolution follows `resolveFeedTargets(repo, feed)`:
     1. Per-guild category binding (`rss`, `reddit`, `freegames`, `streamalerts`).
     2. Guild forum thread target (delivering into dedicated single thread).
     3. Feed-level channel fallback.

5. **Single-Thread Forum Delivery**:
   - Feeds configured for forum delivery stick strictly to one thread per feed source.
   - Sleeping threads are unarchived automatically before posting.