/**
 * tests/helpers/prefix.ts
 *
 * Mock factories for prefix command tests: a Message-shaped object and a
 * DiscordBot-shaped object that records every outbound channel message so
 * assertions can inspect the embeds that would have been delivered.
 */
import type { DiscordBot } from '../../src/bot/bot.js';
import type { DiscordEmbed } from '../../src/bot/utils/types.js';
import type { GuildMember, Message } from 'discord.js';
import { vi } from 'vitest';

export interface RecordedSend {
  channelId: string;
  payload: { content?: string; embeds?: DiscordEmbed[] };
}

export interface MockMessageOptions {
  content: string;
  /** Null simulates a direct message. */
  guildId?: string | null;
  channelId?: string;
  authorId?: string;
  /** Bot authors are always ignored by the dispatcher. */
  isBot?: boolean;
  /** Cached guild member; when null the dispatcher will attempt a fetch. */
  member?: GuildMember | null;
}

/** Builds a Message-shaped object carrying only what the dispatcher reads. */
export function makeMessage(opts: MockMessageOptions): Message {
  return {
    content: opts.content,
    guildId: opts.guildId === undefined ? 'guild-100' : opts.guildId,
    channelId: opts.channelId ?? 'chan-1',
    member: opts.member ?? null,
    author: {
      id: opts.authorId ?? 'user-100',
      bot: opts.isBot ?? false,
      username: 'tester',
    },
  } as unknown as Message;
}

export interface MockBotOptions {
  /** Guilds present in the gateway cache, keyed by guild ID. */
  guilds?: Map<string, unknown>;
}

/**
 * Builds a DiscordBot-shaped mock whose `sendChannelMessage` records payloads.
 * Returns the mock together with the recorded sends for assertions.
 */
export function makeBot(opts: MockBotOptions = {}): { bot: DiscordBot; sent: RecordedSend[] } {
  const sent: RecordedSend[] = [];

  const bot = {
    sendChannelMessage: vi.fn(async (channelId: string, payload: { content?: string; embeds?: DiscordEmbed[] }) => {
      sent.push({ channelId, payload });
    }),
    getClient: () => ({
      guilds: { cache: opts.guilds ?? new Map<string, unknown>() },
    }),
    rest: {},
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as unknown as DiscordBot;

  return { bot, sent };
}

/** Concatenates every embed field name recorded in a send. */
export function fieldNames(send: RecordedSend | undefined): string[] {
  return (send?.payload.embeds ?? []).flatMap((e) => (e.fields ?? []).map((f) => f.name));
}

/** Concatenates every embed title recorded in a send. */
export function embedTitles(send: RecordedSend | undefined): string[] {
  return (send?.payload.embeds ?? []).map((e) => e.title ?? '');
}

/** Concatenates every embed description recorded in a send. */
export function embedDescriptions(send: RecordedSend | undefined): string[] {
  return (send?.payload.embeds ?? []).map((e) => e.description ?? '');
}

/**
 * Concatenates every piece of text in a send's embeds — titles, descriptions,
 * and both halves of each field — so an assertion can target content the builder
 * routed into a section rather than the description.
 */
export function embedText(send: RecordedSend | undefined): string {
  return (send?.payload.embeds ?? [])
    .flatMap((e) => [
      e.title ?? '',
      e.description ?? '',
      ...(e.fields ?? []).flatMap((f) => [f.name, f.value]),
    ])
    .join('\n');
}
