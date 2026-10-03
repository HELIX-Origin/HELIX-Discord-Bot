/**
 * src/bot/commands/prefix/help.ts
 *
 * `[prefix]help` — dynamically lists every registered prefix command.
 *
 * Built from the prefix command registry rather than a hardcoded table, so new
 * commands appear here automatically (Rule 06: prefer dynamic discovery).
 *
 * The registry is never empty while this runs: `help` is itself a registered
 * command, so the dispatcher has already resolved it by name. The "no commands
 * registered yet" case is reported by the dispatcher instead.
 */

import { EmbedHandler } from '../../lib/embeds/builder.js';
import { getAllPrefixCommands } from '../../handlers/prefix.js';
import type { PrefixCommand } from '../../lib/prefix/types.js';
import type { DiscordEmbed } from '../../utils/types.js';

/** Substitutes the guild's live prefix into usage and example strings. */
function withPrefix(template: string, prefix: string): string {
  return template.replace(/\bp\b/g, prefix);
}

export const helpPrefixCommand: PrefixCommand = {
  name: 'help',
  aliases: ['commands', 'h'],
  description: 'List every available prefix command',
  usage: 'p help',
  examples: ['p help'],
  managerOnly: false,
  execute: async (ctx): Promise<DiscordEmbed> => {
    const commands = getAllPrefixCommands().sort((a, b) => a.name.localeCompare(b.name));

    const builder = EmbedHandler.for(ctx.deps)
      .primary()
      .title('Prefix Commands', '📖')
      .description(
        `This server uses the \`${ctx.prefix}\` prefix. Commands are managed from the web dashboard or with \`${ctx.prefix}set\`.`,
      )
      .field(
        'Commands',
        commands
          .map((c) => `\`${withPrefix(c.usage, ctx.prefix)}\`\n${c.description}${c.managerOnly === false ? '' : ' 🔒'}`)
          .join('\n\n'),
        false,
      );

    const examples = commands.flatMap((c) => (c.examples ?? []).map((e) => `\`${withPrefix(e, ctx.prefix)}\``));
    if (examples.length > 0) {
      builder.section('Examples', examples.join('\n'));
    }

    builder.section('Legend', '🔒 Requires Manage Server, Administrator, or the configured manager role.');

    return builder.build();
  },
};
