import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../../utils/types.js';
import type { AppDeps } from '../../../app.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import {
  getCategorizedCommands,
  getCommandMetadata,
  getAllCommandMetadata,
  type BotCommand,
} from '../../handlers/registry.js';

export const helpCommandDef: ApplicationCommand = {
  name: 'help',
  description: 'List all available bot slash commands and their usage',
  options: [
    {
      name: 'command',
      description: 'Get detailed usage information for a specific command',
      type: ApplicationCommandOptionType.STRING,
      required: false,
    },
  ],
};

function formatOptionSummary(option: import('../../utils/types.js').ApplicationCommandOption): string {
  const req = option.required ? 'required' : 'optional';
  return `• \`${option.name}\` *(${req})* — ${option.description}`;
}

function buildCommandDetail(
  handler: import('../../lib/embeds/builder.js').EmbedHandler,
  meta: {
    name: string;
    description: string;
    usage?: string;
    options?: import('../../utils/types.js').ApplicationCommandOption[];
    subcommands?: {
      name: string;
      description: string;
      options?: import('../../utils/types.js').ApplicationCommandOption[];
    }[];
    examples?: string[];
  },
): import('../../lib/embeds/builder.js').EmbedHandler {
  const usageHint = meta.usage ?? `\`/${meta.name}\``;

  handler.info().title(`Help: /${meta.name}`, '📖').description(`**${meta.description}**\n\n**Syntax:** ${usageHint}`);

  if (meta.subcommands && meta.subcommands.length > 0) {
    for (const sub of meta.subcommands) {
      const subArgs =
        sub.options && sub.options.length > 0
          ? `\n**Options:**\n${sub.options.map(formatOptionSummary).join('\n')}`
          : '';
      handler.section(`/${meta.name} ${sub.name}`, `${sub.description}${subArgs}`);
    }
  } else if (meta.options && meta.options.length > 0) {
    handler.section('Options', meta.options.map(formatOptionSummary).join('\n'));
  }

  if (meta.examples && meta.examples.length > 0) {
    handler.section('Examples', meta.examples.map((e) => `\`${e}\``).join('\n'));
  }

  return handler.footer('Slash Command Reference');
}

function buildCategorizedHelp(
  handler: import('../../lib/embeds/builder.js').EmbedHandler,
  categories: { name: string; emoji: string; commands: { name: string; description: string }[] }[],
): import('../../lib/embeds/builder.js').EmbedHandler {
  handler
    .primary()
    .title('Slash Commands', '📖')
    .description(
      'Here is a list of all available slash commands grouped by category. Use `/help <command>` for detailed options and syntax.',
    );

  for (const category of categories) {
    const commandList = category.commands.map((cmd) => `• \`/${cmd.name}\` — ${cmd.description}`).join('\n');
    handler.section(`${category.emoji} ${category.name}`, commandList);
  }

  return handler.footer('Type / in chat to run any command');
}

export async function handleHelpCommand(interaction: DiscordInteraction, deps: AppDeps): Promise<InteractionResponse> {
  const options = interaction.data?.options ?? [];
  const query = options.find((opt) => opt.name === 'command')?.value;

  if (typeof query === 'string' && query.trim()) {
    const targetMeta = getCommandMetadata(query.trim().replace(/^\/+/, '').toLowerCase());
    if (targetMeta) {
      return buildCommandDetail(EmbedHandler.for(deps), targetMeta).respond();
    }

    const availableNames = getAllCommandMetadata()
      .map((c) => `\`/${c.name}\``)
      .join(', ');
    return EmbedHandler.for(deps)
      .error()
      .title('Command Not Found', '❓')
      .description(
        `Could not find a command named \`/${query}\`.\n\n**Available commands:** ${availableNames}\n\nUse \`/help\` to view all commands.`,
      )
      .footer('Slash Command Reference')
      .respond(true);
  }

  const categorized = getCategorizedCommands();
  const categories = [
    {
      name: 'Feeds',
      emoji: '📰',
      commands: categorized.feeds.map((c) => ({ name: c.name, description: c.description })),
    },
    {
      name: 'Admin',
      emoji: '🛡️',
      commands: categorized.admin.map((c) => ({ name: c.name, description: c.description })),
    },
    {
      name: 'Moderation',
      emoji: '⚖️',
      commands: categorized.mod.map((c) => ({ name: c.name, description: c.description })),
    },
    {
      name: 'Entertainment',
      emoji: '😂',
      commands: categorized.entertainment.map((c) => ({ name: c.name, description: c.description })),
    },
    {
      name: 'Utility',
      emoji: '🔧',
      commands: categorized.utility.map((c) => ({ name: c.name, description: c.description })),
    },
  ].filter((cat) => cat.commands.length > 0);

  return buildCategorizedHelp(EmbedHandler.for(deps), categories).respond();
}

export const helpCommand: BotCommand = {
  def: helpCommandDef,
  category: 'utility',
  execute: handleHelpCommand,
};
