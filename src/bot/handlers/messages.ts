export interface MessageOptions {
  ephemeral?: boolean;
  flags?: number;
}

export const EPHEMERAL_FLAGS = 64;
export const SUPPRESS_EMBEDS_FLAGS = 4096;

export function ephemeralMessage(
  content: string,
  embeds?: unknown[],
): {
  type: number;
  data: { content: string; embeds?: unknown[]; flags: number };
} {
  return {
    type: 4,
    data: {
      content,
      embeds,
      flags: EPHEMERAL_FLAGS,
    },
  };
}

export function successMessage(
  content: string,
  embeds?: unknown[],
): {
  type: number;
  data: { content: string; embeds?: unknown[]; flags: number };
} {
  return {
    type: 4,
    data: {
      content: `✅ ${content}`,
      embeds,
      flags: EPHEMERAL_FLAGS,
    },
  };
}

export function errorMessage(
  content: string,
  embeds?: unknown[],
): {
  type: number;
  data: { content: string; embeds?: unknown[]; flags: number };
} {
  return {
    type: 4,
    data: {
      content: `❌ ${content}`,
      embeds,
      flags: EPHEMERAL_FLAGS,
    },
  };
}

export function warningMessage(
  content: string,
  embeds?: unknown[],
): {
  type: number;
  data: { content: string; embeds?: unknown[]; flags: number };
} {
  return {
    type: 4,
    data: {
      content: `⚠️ ${content}`,
      embeds,
      flags: EPHEMERAL_FLAGS,
    },
  };
}

export function infoMessage(
  content: string,
  embeds?: unknown[],
): {
  type: number;
  data: { content: string; embeds?: unknown[]; flags: number };
} {
  return {
    type: 4,
    data: {
      content: `ℹ️ ${content}`,
      embeds,
      flags: EPHEMERAL_FLAGS,
    },
  };
}

export function publicMessage(
  content: string,
  embeds?: unknown[],
): {
  type: number;
  data: { content: string; embeds?: unknown[] };
} {
  return {
    type: 4,
    data: {
      content,
      embeds,
    },
  };
}

export function buildContent(template: string, replacements: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? `{${key}}`);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function codeBlock(content: string, language = ''): string {
  return `\`\`\`${language}\n${content}\n\`\`\``;
}

export function inlineCode(content: string): string {
  return `\`${content}\``;
}

export function bold(content: string): string {
  return `**${content}**`;
}

export function italic(content: string): string {
  return `*${content}*`;
}

export function strikethrough(content: string): string {
  return `~~${content}~~`;
}

export function quote(content: string): string {
  return `> ${content.replace(/\n/g, '\n> ')}`;
}

export function mentionUser(userId: string): string {
  return `<@${userId}>`;
}

export function mentionRole(roleId: string): string {
  return `<@&${roleId}>`;
}

export function mentionChannel(channelId: string): string {
  return `<#${channelId}>`;
}

export function formatTimestamp(ts: number | Date, style: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' = 'f'): string {
  const date = ts instanceof Date ? ts : new Date(ts);
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function humanizeList<T>(items: T[], formatter: (item: T) => string): string {
  const formatted = items.map(formatter);
  if (formatted.length === 0) return 'none';
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
}
