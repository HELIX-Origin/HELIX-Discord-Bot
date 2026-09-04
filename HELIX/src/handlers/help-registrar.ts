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

export function getHelpByCategory(): Map<string, CommandHelp[]> {
  const grouped = new Map<string, CommandHelp[]>();
  for (const cat of categoryOrder) {
    grouped.set(cat, allHelp.filter(h => h.category === cat));
  }
  return grouped;
}

const categoryOrder = ['moderation', 'utility', 'plugins', 'info', 'project', 'config'] as const;

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
  plugins: 'Language Plugins',
  info: 'Information & Diagnostics',
  project: 'Project Scaffolding',
  config: 'Configuration & Tickets',
};

export function getCategoryEmoji(category: string): string {
  return categoryEmoji[category] || '📋';
}

export function getCategoryLabel(category: string): string {
  return categoryLabel[category] || category;
}

export function helpCount(): number {
  return allHelp.length;
}
