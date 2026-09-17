import type { Client, Guild } from 'discord.js';
import type { AppDeps } from '../../app.js';
import { EmbedHandler } from '../lib/embeds/builder.js';

/**
 * Event name as registered with discord.js Client (e.g. 'ready', 'interactionCreate', 'guildCreate').
 */
export const name = 'guildCreate';

/**
 * Whether this event should only be triggered once (e.g. true for 'ready', false for 'interactionCreate').
 */
export const once = false;

/**
 * Event execution handler.
 * Events leverage shared libraries, modules, and utilities in `src/bot/lib/` (e.g. embeds, admin, feeds).
 * Wrapped in try/catch to ensure errors never bring down the bot process.
 */
export async function execute(client: Client, deps: AppDeps, guild: Guild): Promise<void> {
  try {
    deps.logger.info(`Joined new guild: ${guild.name} (${guild.id})`, {
      botUser: client.user?.tag,
      memberCount: guild.memberCount,
    });

    // Example: Initialize guild settings using AppState / repositories
    deps.repo.getOrCreateGuildUser(guild.id);

    // Example: Utilize shared EmbedHandler from src/bot/lib/embeds/
    const welcomeEmbed = EmbedHandler.for(deps)
      .primary()
      .title('Thanks for adding HELIX!', '🎉')
      .description('Use `/help` to see all available commands or visit the dashboard to configure feeds.')
      .build();

    deps.logger.debug('Generated welcome embed for new guild', { embedTitle: welcomeEmbed.data.title });
  } catch (err) {
    deps.logger.error(`Error in event [${name}]`, {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}