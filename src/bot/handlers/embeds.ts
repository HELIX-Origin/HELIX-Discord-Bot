import type { DiscordEmbed, DiscordEmbedField } from '../types.js';
import { InteractionResponseType, type InteractionResponse } from '../types.js';

export interface EmbedColors {
  readonly PRIMARY: number;
  readonly SUCCESS: number;
  readonly WARNING: number;
  readonly ERROR: number;
  readonly INFO: number;
  readonly DISCORD: number;
  readonly GIF: number;
}

export const EMBED_COLORS: EmbedColors = {
  PRIMARY: 0x06b6d4,
  SUCCESS: 0x10b981,
  WARNING: 0xf59e0b,
  ERROR: 0xef4444,
  INFO: 0x3b82f6,
  DISCORD: 0x5865f2,
  GIF: 0x06b6d4,
};

export function createEmbed(overrides: Partial<DiscordEmbed> = {}): DiscordEmbed {
  return {
    color: EMBED_COLORS.PRIMARY,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'HELIX Discord Bot',
      icon_url: undefined,
    },
    ...overrides,
  };
}

export function successEmbed(title: string, description?: string, fields?: DiscordEmbedField[]): DiscordEmbed {
  return createEmbed({
    color: EMBED_COLORS.SUCCESS,
    title: `✅ ${title}`,
    description,
    fields,
  });
}

export function errorEmbed(title: string, description?: string, fields?: DiscordEmbedField[]): DiscordEmbed {
  return createEmbed({
    color: EMBED_COLORS.ERROR,
    title: `❌ ${title}`,
    description,
    fields,
  });
}

export function warningEmbed(title: string, description?: string, fields?: DiscordEmbedField[]): DiscordEmbed {
  return createEmbed({
    color: EMBED_COLORS.WARNING,
    title: `⚠️ ${title}`,
    description,
    fields,
  });
}

export function infoEmbed(title: string, description?: string, fields?: DiscordEmbedField[]): DiscordEmbed {
  return createEmbed({
    color: EMBED_COLORS.INFO,
    title: `ℹ️ ${title}`,
    description,
    fields,
  });
}

export function gifEmbed(url: string, category?: string, requester?: string): DiscordEmbed {
  return createEmbed({
    color: EMBED_COLORS.GIF,
    title: category ? `GIF — ${category}` : 'Random GIF',
    description: requester ? `Requested by ${requester}` : undefined,
    image: { url },
    footer: {
      text: 'Powered by KLIPY',
    },
  });
}

export function feedEmbed(feedName: string, feedUrl: string, enabled: boolean, category: string): DiscordEmbed {
  return createEmbed({
    color: enabled ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING,
    title: `📡 ${feedName}`,
    description: enabled ? 'Active feed' : 'Paused feed',
    fields: [
      { name: 'URL', value: feedUrl, inline: false },
      { name: 'Category', value: category, inline: true },
      { name: 'Status', value: enabled ? 'Enabled' : 'Disabled', inline: true },
    ],
  });
}

export function queueEmbed(title: string, description: string, fields?: DiscordEmbedField[]): DiscordEmbed {
  return createEmbed({
    color: EMBED_COLORS.PRIMARY,
    title,
    description,
    fields,
  });
}

export function musicEmbed(
  title: string,
  description?: string,
  thumbnail?: string,
  fields?: DiscordEmbedField[],
): DiscordEmbed {
  return createEmbed({
    color: EMBED_COLORS.PRIMARY,
    title: `🎵 ${title}`,
    description,
    thumbnail: thumbnail ? { url: thumbnail } : undefined,
    fields,
  });
}

export function helpEmbed(
  commandGroups: Array<{ name: string; commands: Array<{ name: string; description: string }> }>,
): DiscordEmbed {
  const fields: DiscordEmbedField[] = commandGroups.flatMap((group) => [
    { name: `**${group.name}**`, value: '\u200b', inline: false },
    ...group.commands.map((cmd) => ({
      name: `/${cmd.name}`,
      value: cmd.description,
      inline: true,
    })),
  ]);

  return createEmbed({
    color: EMBED_COLORS.INFO,
    title: '📚 HELIX Discord Bot — Command Reference',
    description: 'All available slash commands grouped by category.',
    fields,
  });
}

export function commandHelpEmbed(command: {
  name: string;
  description: string;
  usage?: string;
  subcommands?: Array<{
    name: string;
    description: string;
    options?: Array<{ name: string; description: string; required?: boolean; type?: string }>;
  }>;
  examples?: string[];
}): DiscordEmbed {
  const fields: DiscordEmbedField[] = [];

  if (command.usage) {
    fields.push({ name: 'Usage', value: `\`/${command.name} ${command.usage}\``, inline: false });
  }

  if (command.subcommands && command.subcommands.length > 0) {
    const subList = command.subcommands
      .map((sc) => {
        const opts =
          sc.options
            ?.map((o) => `\`${o.name}${o.required ? '' : '?'}\` (${o.type ?? 'string'}) — ${o.description}`)
            .join('\n') || 'No options';
        return `**/${command.name} ${sc.name}** — ${sc.description}\n${opts}`;
      })
      .join('\n\n');
    fields.push({ name: 'Subcommands', value: subList, inline: false });
  }

  if (command.examples && command.examples.length > 0) {
    fields.push({ name: 'Examples', value: command.examples.map((e) => `\`${e}\``).join('\n'), inline: false });
  }

  return createEmbed({
    color: EMBED_COLORS.INFO,
    title: `📖 Help: /${command.name}`,
    description: command.description,
    fields,
  });
}

export function commandHelpResponse(command: {
  name: string;
  description: string;
  usage?: string;
  subcommands?: Array<{
    name: string;
    description: string;
    options?: Array<{ name: string; description: string; required?: boolean; type?: string }>;
  }>;
  examples?: string[];
}): InteractionResponse {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { embeds: [commandHelpEmbed(command)] },
  };
}

export function buildCommandOptions<T extends Record<string, unknown>>(options: T): T {
  return options;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}
