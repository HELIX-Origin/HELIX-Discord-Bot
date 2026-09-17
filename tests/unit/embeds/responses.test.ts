/**
 * tests/unit/embeds/responses.test.ts
 *
 * Unit tests for embed response helper functions.
 * Verifies response shape, ephemeral flag, and content wrappers.
 */
import { describe, it, expect } from 'vitest';
import {
  embedResponse,
  embedMessage,
  ephemeralContent,
  publicContent,
  errorContent,
  errorEmbedResponse,
  successContent,
  successEmbedResponse,
  EPHEMERAL,
} from '../../../src/bot/lib/embeds/responses.js';
import type { DiscordEmbed } from '../../../src/bot/utils/types.js';

const MOCK_EMBED: DiscordEmbed = { color: 0x06b6d4, title: 'Test' };

describe('embedResponse()', () => {
  it('wraps an embed in a CHANNEL_MESSAGE_WITH_SOURCE interaction response', () => {
    const res = embedResponse(MOCK_EMBED);
    expect(res.data?.embeds).toHaveLength(1);
    expect(res.data?.embeds![0]).toBe(MOCK_EMBED);
  });

  it('does not set the ephemeral flag by default', () => {
    const res = embedResponse(MOCK_EMBED);
    expect(res.data?.flags).toBeUndefined();
  });

  it('sets flags=64 when ephemeral=true', () => {
    const res = embedResponse(MOCK_EMBED, true);
    expect(res.data?.flags).toBe(EPHEMERAL);
  });
});

describe('embedMessage()', () => {
  it('returns a message object with the embed in an array', () => {
    const msg = embedMessage(MOCK_EMBED);
    expect(msg.embeds).toHaveLength(1);
    expect(msg.embeds[0]).toBe(MOCK_EMBED);
  });
});

describe('ephemeralContent()', () => {
  it('returns an ephemeral text response', () => {
    const res = ephemeralContent('Only you can see this');
    expect(res.data?.flags).toBe(EPHEMERAL);
    expect(res.data?.content).toBe('Only you can see this');
  });
});

describe('publicContent()', () => {
  it('returns a public text response with no flags', () => {
    const res = publicContent('Hello everyone');
    expect(res.data?.content).toBe('Hello everyone');
    expect(res.data?.flags).toBeUndefined();
  });
});

describe('errorContent()', () => {
  it('is an alias for ephemeralContent', () => {
    const res = errorContent('Something went wrong');
    expect(res.data?.flags).toBe(EPHEMERAL);
    expect(res.data?.content).toBe('Something went wrong');
  });
});

describe('successContent()', () => {
  it('is an alias for publicContent', () => {
    const res = successContent('Done!');
    expect(res.data?.content).toBe('Done!');
    expect(res.data?.flags).toBeUndefined();
  });
});

describe('errorEmbedResponse()', () => {
  it('builds an embed with the error color', () => {
    const res = errorEmbedResponse('Oops', 'Something failed');
    expect(res.data?.embeds![0].color).toBe(0xef4444);
  });

  it('prefixes the title with the ❌ emoji', () => {
    const res = errorEmbedResponse('Oops', 'desc');
    expect(res.data?.embeds![0].title).toContain('❌');
    expect(res.data?.embeds![0].title).toContain('Oops');
  });

  it('is ephemeral by default', () => {
    const res = errorEmbedResponse('Oops', 'desc');
    expect(res.data?.flags).toBe(EPHEMERAL);
  });

  it('can be made non-ephemeral', () => {
    const res = errorEmbedResponse('Oops', 'desc', false);
    expect(res.data?.flags).toBeUndefined();
  });
});

describe('successEmbedResponse()', () => {
  it('builds an embed with the success color', () => {
    const res = successEmbedResponse('Great');
    expect(res.data?.embeds![0].color).toBe(0x10b981);
  });

  it('prefixes the title with the ✅ emoji', () => {
    const res = successEmbedResponse('Great');
    expect(res.data?.embeds![0].title).toContain('✅');
    expect(res.data?.embeds![0].title).toContain('Great');
  });

  it('includes the description when provided', () => {
    const res = successEmbedResponse('Great', 'All done');
    expect(res.data?.embeds![0].description).toBe('All done');
  });
});
