# Template: Discord.js Client Event Handler

**Target**: `src/bot/events/<event>.ts`  
**Compliance**: Rule 06 (Discord.js Standards) — Modular event handlers registered via `registerBotEvents`.

```ts
import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import type { Guild } from 'discord.js';
import { EmbedHandler } from '../lib/embeds/builder.js';

/**
 * Modular Event Handler.
 * Invoked from src/bot/handlers/events.ts upon client event dispatch.
 */
export async function handleGuildCreate(
  guild: Guild,
  bot: DiscordBot,
  deps: AppDeps,
): Promise<void> {
  try {
    bot.logger.info(`Bot joined guild: ${guild.name} (${guild.id})`, {
      memberCount: guild.memberCount,
    });

    // Initialize guild settings in repository
    deps.repo.getOrCreateGuildUser(guild.id);

    // Build welcome notification using shared EmbedHandler
    const welcomeEmbed = EmbedHandler.for(deps)
      .primary()
      .title('Thanks for adding HELIX!', '🎉')
      .description('Configure feeds and alert targets on the management dashboard.')
      .build();

    bot.logger.debug('Initialized new guild', { guildId: guild.id });
  } catch (err) {
    bot.logger.error('Error handling guildCreate event', {
      guildId: guild.id,
      error: (err as Error).message,
    });
  }
}
```
