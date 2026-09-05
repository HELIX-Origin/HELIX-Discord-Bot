import { EmbedBuilder } from 'discord.js';
import { logs } from './logs-handler.js';

export interface CommandHelpOption {
  name: string;
  description: string;
  type?: string;
  required?: boolean;
}

export interface CommandHelpSubcommand {
  name: string;
  description: string;
  options?: CommandHelpOption[];
}

export interface CommandHelp {
  name: string;
  description: string;
  category: string;
  usage: string;
  permissions: string[];
  aliases?: string[];
  subcommands?: (string | CommandHelpSubcommand)[];
  options?: CommandHelpOption[];
  examples?: string[];
}

const allHelp: CommandHelp[] = [];

export function createHelp(
  name: string,
  description: string,
  category: string,
  options: {
    usage?: string;
    permissions?: string[];
    aliases?: string[];
    subcommands?: (string | CommandHelpSubcommand)[];
    options?: CommandHelpOption[];
    examples?: string[];
  } = {},
): CommandHelp {
  let cleanUsage = options.usage || '';
  if (cleanUsage.startsWith('>')) {
    cleanUsage = cleanUsage.slice(1).trim();
  }
  return {
    name,
    description,
    category,
    usage: cleanUsage,
    permissions: options.permissions || [],
    aliases: options.aliases,
    subcommands: options.subcommands,
    options: options.options,
    examples: options.examples,
  };
}

export function registerHelp(help: CommandHelp): void {
  const existing = allHelp.findIndex(h => h.name === help.name);
  if (existing >= 0) {
    allHelp[existing] = help;
  } else {
    allHelp.push(help);
  }
}

export function getAllHelp(): CommandHelp[] {
  return allHelp;
}

export function getCommandHelp(name: string): CommandHelp | undefined {
  const lower = name.toLowerCase().replace(/^[>!/]/, '');
  return allHelp.find(h => h.name.toLowerCase() === lower || h.aliases?.some(a => a.toLowerCase() === lower));
}

export const categoryOrder = ['moderation', 'utility', 'plugins', 'info', 'project', 'config'] as const;
export type CategoryKey = (typeof categoryOrder)[number];

const categoryEmoji: Record<string, string> = {
  moderation: '🛡️',
  utility: '🧰',
  plugins: '🧩',
  info: '📊',
  project: '🛠️',
  config: '⚙️',
};

const categoryLabel: Record<string, string> = {
  moderation: 'Moderation Suite',
  utility: 'Utility Suite',
  plugins: 'Language Plugins & Intelligence',
  info: 'Information & Diagnostics',
  project: 'Project Scaffolding',
  config: 'Configuration & Tickets',
};

const categoryDescription: Record<string, string> = {
  moderation: 'Enforce server rules, log infractions, and manage server members with audit tracking.',
  utility: 'General developer utilities, time reminders, avatar inspection, and server info.',
  plugins: 'In-process static analysis, AST parsing, linting, code explanation, and documentation.',
  info: 'System diagnostics, bot status telemetry, and help documentation.',
  project: 'Scaffold 17+ framework starters for Web, Mobile, Desktop, and Game Engines.',
  config: 'Configure guild prefixes, ticket hubs, and language plugin repositories.',
};

const categoryColor: Record<string, string> = {
  moderation: '#ff5252',
  utility: '#00d2ff',
  plugins: '#00e676',
  info: '#00b0ff',
  project: '#7c4dff',
  config: '#ffab00',
};

export function getCategoryEmoji(category: string): string {
  return categoryEmoji[category] || '📋';
}

export function getCategoryLabel(category: string): string {
  return categoryLabel[category] || category;
}

export function getCategoryDescription(category: string): string {
  return categoryDescription[category] || 'Commands in this category.';
}

export function getCategoryColor(category: string): string {
  return categoryColor[category] || '#00d2ff';
}

export function getHelpByCategory(): Map<string, CommandHelp[]> {
  const grouped = new Map<string, CommandHelp[]>();
  for (const cat of categoryOrder) {
    grouped.set(cat, allHelp.filter(h => h.category === cat));
  }
  return grouped;
}

export function helpCount(): number {
  return allHelp.length;
}

export function clearHelpRegistry(): void {
  allHelp.length = 0;
}

export function buildCommandHelpEmbed(
  help: CommandHelp,
  prefix: string,
  opts?: { missingNotice?: string; customUsage?: string }
): EmbedBuilder {
  const emoji = getCategoryEmoji(help.category);
  const color = opts?.missingNotice ? '#ff5252' : getCategoryColor(help.category);

  let usageText = '';
  if (opts?.customUsage) {
    const raw = opts.customUsage.startsWith('>') ? opts.customUsage.slice(1).trim() : opts.customUsage;
    usageText = raw.startsWith(prefix) ? raw : `${prefix}${raw}`;
  } else if (!help.usage) {
    usageText = `${prefix}${help.name}`;
  } else if (help.usage.startsWith(help.name)) {
    usageText = `${prefix}${help.usage}`;
  } else if (help.usage.startsWith('>')) {
    usageText = `${prefix}${help.usage.slice(1).trim()}`;
  } else {
    usageText = `${prefix}${help.name} ${help.usage}`;
  }

  const aliasText = help.aliases && help.aliases.length ? help.aliases.map(a => `\`${prefix}${a}\``).join(', ') : 'None';
  const permsText = help.permissions && help.permissions.length ? help.permissions.map(p => `\`${p}\``).join(', ') : 'Everyone';

  const embed = new EmbedBuilder()
    .setColor(color as any)
    .setTitle(`${emoji} Command Help: \`${prefix}${help.name}\``)
    .setTimestamp();

  if (opts?.missingNotice) {
    embed.setDescription(`> ⚠️ **Missing Required Parameter**: ${opts.missingNotice}\n\n${help.description}`);
  } else {
    embed.setDescription(help.description);
  }

  // Balanced Inline Metadata Fields
  embed.addFields(
    { name: 'Category', value: `${emoji} ${getCategoryLabel(help.category)}`, inline: true },
    { name: 'Permissions', value: permsText, inline: true },
    { name: 'Aliases', value: aliasText, inline: true }
  );

  // Non-inline Syntax / Usage
  embed.addFields({
    name: 'Syntax & Usage',
    value: `\`\`\`syntax\n${usageText}\n\`\`\``,
    inline: false,
  });

  // Options / Arguments Breakdown
  if (help.options && help.options.length > 0) {
    const optLines = help.options.map(o => {
      const badge = o.required ? '**`REQUIRED`**' : '*`OPTIONAL`*';
      const typeStr = o.type ? `(\`${o.type}\`)` : '';
      return `• \`<${o.name}>\` ${typeStr} ${badge}\n  ${o.description}`;
    });
    embed.addFields({
      name: 'Arguments & Parameters',
      value: optLines.join('\n'),
      inline: false,
    });
  }

  // Subcommands (if any)
  if (help.subcommands && help.subcommands.length > 0) {
    const subLines = help.subcommands.map(s => {
      if (typeof s === 'object' && s !== null) {
        const optStr = s.options && s.options.length > 0
          ? ' ' + s.options.map(o => o.required ? `<${o.name}>` : `[${o.name}]`).join(' ')
          : '';
        return `• \`${prefix}${help.name} ${s.name}${optStr}\` — ${s.description}`;
      }
      return `• \`${prefix}${help.name} ${s}\``;
    });
    embed.addFields({
      name: 'Available Subcommands & Features',
      value: subLines.join('\n'),
      inline: false,
    });
  }

  // Examples (if any)
  if (help.examples && help.examples.length > 0) {
    const exLines = help.examples.map(e => {
      let raw = e.startsWith('>') ? e.slice(1).trim() : e;
      if (raw.startsWith(prefix)) return raw;
      if (raw.startsWith(help.name)) return `${prefix}${raw}`;
      return `${prefix}${help.name} ${raw}`;
    });
    embed.addFields({
      name: 'Examples',
      value: `\`\`\`bash\n${exLines.join('\n')}\n\`\`\``,
      inline: false,
    });
  }

  embed.setFooter({
    text: `Prefix: ${prefix} • Type ${prefix}help to browse all categories`,
  });

  return embed;
}

export function getCommandHelpEmbed(
  commandName: string,
  prefix: string,
  opts?: { missingNotice?: string; customUsage?: string }
): EmbedBuilder {
  const help = getCommandHelp(commandName);
  if (!help) {
    const notice = opts?.missingNotice || `Missing required arguments for command \`${prefix}${commandName}\`.`;
    const embed = new EmbedBuilder()
      .setColor('#ff5252')
      .setTitle(`⚠️ Command Help: \`${prefix}${commandName}\``)
      .setDescription(`> ⚠️ **Missing Required Parameter:** ${notice}`)
      .setTimestamp()
      .setFooter({ text: `Prefix: ${prefix} • Type ${prefix}help to browse all categories` });

    if (opts?.customUsage) {
      embed.addFields({
        name: 'Syntax & Usage',
        value: `\`\`\`syntax\n${opts.customUsage}\n\`\`\``,
        inline: false,
      });
    }

    return embed;
  }
  return buildCommandHelpEmbed(help, prefix, opts);
}
