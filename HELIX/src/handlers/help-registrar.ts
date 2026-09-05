import { logs } from './logs-handler.js';

export interface CommandHelp {
  name: string;
  description: string;
  category: string;
  usage: string;
  permissions: string[];
  aliases?: string[];
  subcommands?: string[];
}

const allHelp: CommandHelp[] = [];

export function createHelp(
  name: string,
  description: string,
  category: string,
  options: { usage?: string; permissions?: string[]; aliases?: string[]; subcommands?: string[] } = {},
): CommandHelp {
  return {
    name,
    description,
    category,
    usage: options.usage || `>${name}`,
    permissions: options.permissions || [],
    aliases: options.aliases,
    subcommands: options.subcommands,
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
