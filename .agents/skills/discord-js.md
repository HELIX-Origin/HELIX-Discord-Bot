# Skill: Discord.js v14 Engineering & Modular Architecture

## Overview
This skill provides deep operational reference for engineering Discord bots with **discord.js v14** within the **HELIX Discord Bot** codebase, with emphasis on self-contained commands (options and subcommands colocated in command files) and reusable libraries in `src/bot/lib/`.

---

## 1. Command Structure & Options Pattern

### Why Colocate Options in Command Files?
- **Self-Contained & Understandable**: Keeping option definitions, choices, and subcommands in the command file (`src/bot/commands/<category>/<command>.ts`) provides instant visibility of the schema alongside the execution logic.
- **Discord API Limits**: Max 25 options per command/subcommand, max 25 choices per option, 4,000 characters total command definition budget.
- **Shared Libs in `src/bot/lib/`**: The `lib/` directory is reserved for reusable modules, helpers, and utilities (such as `embeds/`, `admin/`, `feeds/`), rather than individual option files.

### Command Structure Example (`src/bot/commands/entertainment/gif.ts`):
```ts
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../../utils/types.js';
import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { registerCommandMetadata } from '../../handlers/registry.js';

export const gifCommandDef: ApplicationCommand = {
  name: 'gif',
  description: 'Search for and display an animated GIF from KLIPY',
  dm_permission: true,
  options: [
    {
      name: 'category',
      description: 'The reaction category or tag',
      type: ApplicationCommandOptionType.STRING,
      required: false,
      autocomplete: true,
    },
  ],
};

export async function handleGifCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  // Command execution logic using deps and lib/ utilities...
  return EmbedHandler.for(deps).title('GIF Result').respond();
}

registerCommandMetadata({
  name: 'gif',
  description: 'Search for and display an animated GIF',
  category: 'entertainment',
  emoji: '🎬',
  usage: '/gif [category]',
});
```

---

## 2. Shared Libraries in `src/bot/lib/`

Libraries, modules, and utilities used across multiple commands and events reside in `src/bot/lib/`:

- **`lib/embeds/`**: `EmbedHandler` fluent builder and limit clampers (used by commands, event notifications, and system alerts).
- **`lib/admin/`**: Permission checks, role hierarchy validation, and mod logs (used by admin commands and guild member/role events).
- **`lib/feeds/`**: Feed formatting, pagination, and syndication helpers (used by feed commands and scheduled watchers).

---

## 3. Discord.js Guidelines

1. **Never use magic numbers**:
   - `flags: 64` ➔ `.respond(true)` or `flags: EPHEMERAL`
   - `type: 4` ➔ `InteractionResponseType.ChannelMessageWithSource`
2. **Ephemeral vs Public Responses**:
   - Administrative errors, validation failures, and sensitive diagnostics must use `.respond(true)` (ephemeral).
   - Public updates, entertainment responses, and syndication posts use `.respond()`.
3. **Embed Construction**:
   - Always use `EmbedHandler.for(deps)` which automatically applies the bot's application branding, icon, and colors.
   - Text fields are auto-clamped by `limits.ts` to prevent Discord 400 Bad Request errors.
