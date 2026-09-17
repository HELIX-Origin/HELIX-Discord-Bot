/**
 * tests/unit/embeds/builder.test.ts
 *
 * Unit tests for EmbedHandler — the fluent builder chain.
 * Uses the bareHandler() helper from tests/helpers/embed.ts.
 * No AppDeps / branding is used; these tests focus purely on the builder API.
 */
import { describe, it, expect } from 'vitest';
import { EmbedHandler, EMBED_LIMITS, TEXT_LIMITS } from '../../../src/bot/lib/embeds/builder.js';
import { EMBED_VARIANTS } from '../../../src/bot/lib/embeds/variants.js';
import { bareHandler, buildEmbed } from '../../helpers/embed.js';

// ── Variants / colors ─────────────────────────────────────────────────────────

describe('EmbedHandler — variant selection', () => {
  it('defaults to the primary variant color', () => {
    expect(bareHandler().build().color).toBe(EMBED_VARIANTS.primary.color);
  });

  it('.success() sets the success variant color', () => {
    expect(buildEmbed((h) => h.success()).color).toBe(EMBED_VARIANTS.success.color);
  });

  it('.error() sets the error variant color', () => {
    expect(buildEmbed((h) => h.error()).color).toBe(EMBED_VARIANTS.error.color);
  });

  it('.warning() sets the warning variant color', () => {
    expect(buildEmbed((h) => h.warning()).color).toBe(EMBED_VARIANTS.warning.color);
  });

  it('.info() sets the info variant color', () => {
    expect(buildEmbed((h) => h.info()).color).toBe(EMBED_VARIANTS.info.color);
  });

  it('.variant("success") is equivalent to .success()', () => {
    expect(buildEmbed((h) => h.variant('success')).color).toBe(EMBED_VARIANTS.success.color);
  });

  it('.color() overrides the variant color', () => {
    expect(buildEmbed((h) => h.success().color(0xabcdef)).color).toBe(0xabcdef);
  });
});

// ── Title & emoji ─────────────────────────────────────────────────────────────

describe('EmbedHandler — title', () => {
  it('prefixes the variant emoji before the title text', () => {
    const embed = buildEmbed((h) => h.success().title('Done'));
    expect(embed.title).toContain('✅');
    expect(embed.title).toContain('Done');
  });

  it('passing emoji=false suppresses the emoji', () => {
    const embed = buildEmbed((h) => h.success().title('Clean', false));
    expect(embed.title).toBe('Clean');
  });

  it('clamps title text to TEXT_LIMITS.title', () => {
    const long = 'T'.repeat(TEXT_LIMITS.title + 50);
    const embed = buildEmbed((h) => h.title(long));
    // title = emoji + ' ' + clamped text; test that it is not raw-long
    expect((embed.title ?? '').length).toBeLessThanOrEqual(TEXT_LIMITS.title + 5);
  });

  it('produces no title field when none is set', () => {
    expect(buildEmbed((h) => h).title).toBeUndefined();
  });
});

// ── Description ───────────────────────────────────────────────────────────────

describe('EmbedHandler — description', () => {
  it('sets the description field', () => {
    const embed = buildEmbed((h) => h.description('Hello'));
    expect(embed.description).toBe('Hello');
  });

  it('passing null produces no description field', () => {
    const embed = buildEmbed((h) => h.description(null));
    expect(embed.description).toBeUndefined();
  });

  it('passing undefined produces no description field', () => {
    const embed = buildEmbed((h) => h.description(undefined));
    expect(embed.description).toBeUndefined();
  });

  it('clamps to TEXT_LIMITS.description by default', () => {
    const long = 'x'.repeat(TEXT_LIMITS.description + 100);
    const embed = buildEmbed((h) => h.description(long));
    expect((embed.description ?? '').length).toBeLessThanOrEqual(TEXT_LIMITS.description + 1);
  });

  it('accepts a custom max length', () => {
    const embed = buildEmbed((h) => h.description('a'.repeat(200), 50));
    expect((embed.description ?? '').length).toBeLessThanOrEqual(51);
  });
});

// ── Fields ────────────────────────────────────────────────────────────────────

describe('EmbedHandler — fields', () => {
  it('.field() appends a field with inline=true by default', () => {
    const embed = buildEmbed((h) => h.field('Name', 'Value'));
    expect(embed.fields).toHaveLength(1);
    expect(embed.fields![0]).toMatchObject({ name: 'Name', value: 'Value', inline: true });
  });

  it('.field() respects explicit inline=false', () => {
    const embed = buildEmbed((h) => h.field('N', 'V', false));
    expect(embed.fields![0].inline).toBe(false);
  });

  it('.section() creates a non-inline field', () => {
    const embed = buildEmbed((h) => h.section('Heading', 'Body'));
    expect(embed.fields![0].inline).toBe(false);
  });

  it('.fields() batch-adds multiple fields', () => {
    const embed = buildEmbed((h) =>
      h.fields([
        { name: 'A', value: '1' },
        { name: 'B', value: '2', inline: false },
      ]),
    );
    expect(embed.fields).toHaveLength(2);
    expect(embed.fields![1].inline).toBe(false);
  });

  it('enforces the 25-field Discord cap', () => {
    const h = bareHandler();
    for (let i = 0; i < 30; i++) h.field(`F${i}`, `V${i}`);
    expect(h.build().fields).toHaveLength(EMBED_LIMITS.fields);
  });

  it('fields beyond the cap are silently dropped', () => {
    const h = bareHandler();
    for (let i = 0; i < 30; i++) h.field(`F${i}`, `V${i}`);
    const fields = h.build().fields!;
    expect(fields[0].name).toBe('F0');
    expect(fields[24].name).toBe('F24');
  });
});

// ── Media / URL ───────────────────────────────────────────────────────────────

describe('EmbedHandler — media and URL', () => {
  it('.thumbnail() sets the thumbnail url', () => {
    const embed = buildEmbed((h) => h.thumbnail('https://cdn.test/thumb.png'));
    expect(embed.thumbnail?.url).toBe('https://cdn.test/thumb.png');
  });

  it('.thumbnail(null) produces no thumbnail field', () => {
    const embed = buildEmbed((h) => h.thumbnail(null));
    expect(embed.thumbnail).toBeUndefined();
  });

  it('.image() sets the image url', () => {
    const embed = buildEmbed((h) => h.image('https://cdn.test/img.jpg'));
    expect(embed.image?.url).toBe('https://cdn.test/img.jpg');
  });

  it('.url() sets the embed hyperlink', () => {
    const embed = buildEmbed((h) => h.url('https://example.com/post'));
    expect(embed.url).toBe('https://example.com/post');
  });
});

// ── Author / footer ───────────────────────────────────────────────────────────

describe('EmbedHandler — author and footer', () => {
  it('.author() sets author name', () => {
    const embed = buildEmbed((h) => h.author('HELIX'));
    expect(embed.author?.name).toBe('HELIX');
  });

  it('.author() sets author icon_url when provided', () => {
    const embed = buildEmbed((h) => h.author('HELIX', 'https://cdn.test/icon.png'));
    expect(embed.author?.icon_url).toBe('https://cdn.test/icon.png');
  });

  it('.withoutAuthor() suppresses branding-derived author (null branding = no author)', () => {
    // When branding is null AND no explicit .author() is set, author is always undefined.
    // withoutAuthor() only affects the branding fallback path, not an explicitly set author.
    const embed = buildEmbed((h) => h.withoutAuthor());
    expect(embed.author).toBeUndefined();
  });

  it('.withoutAuthor() does NOT suppress an explicitly set .author()', () => {
    // Per builder source (line 138): `else if (this.embedAuthor) embed.author = this.embedAuthor`
    // An explicit author is always written regardless of showAuthor flag.
    const embed = buildEmbed((h) => h.author('HELIX').withoutAuthor());
    expect(embed.author?.name).toBe('HELIX');
  });

  it('.rawFooter() sets a literal footer text', () => {
    const embed = buildEmbed((h) => h.rawFooter('Custom footer text'));
    expect(embed.footer?.text).toBe('Custom footer text');
  });
});

// ── Timestamp ─────────────────────────────────────────────────────────────────

describe('EmbedHandler — timestamp', () => {
  it('includes a timestamp by default', () => {
    const embed = buildEmbed((h) => h);
    expect(embed.timestamp).toBeDefined();
    // Must be a valid ISO 8601 string
    expect(new Date(embed.timestamp!).getTime()).not.toBeNaN();
  });

  it('.withoutTimestamp() removes the timestamp', () => {
    const embed = buildEmbed((h) => h.withoutTimestamp());
    expect(embed.timestamp).toBeUndefined();
  });

  it('.timestamp(iso) sets an explicit ISO string', () => {
    const iso = '2025-01-15T08:00:00.000Z';
    const embed = buildEmbed((h) => h.timestamp(iso));
    expect(embed.timestamp).toBe(iso);
  });

  it('.timestamp() with no argument defaults to now (approximately)', () => {
    const before = Date.now();
    const embed = buildEmbed((h) => h.timestamp());
    const after = Date.now();
    const ts = new Date(embed.timestamp!).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after + 100);
  });
});

// ── respond / message ─────────────────────────────────────────────────────────

describe('EmbedHandler — response helpers', () => {
  it('.respond() wraps the embed in an interaction response', () => {
    const res = bareHandler().success().title('OK').respond();
    expect(res.data?.embeds).toHaveLength(1);
    expect(res.data?.embeds![0].color).toBe(EMBED_VARIANTS.success.color);
  });

  it('.respond(false) does not set the ephemeral flag', () => {
    const res = bareHandler().respond(false);
    expect(res.data?.flags).toBeUndefined();
  });

  it('.respond(true) sets flags=64 (ephemeral)', () => {
    const res = bareHandler().respond(true);
    expect(res.data?.flags).toBe(64);
  });

  it('.message() returns { embeds: [...] }', () => {
    const msg = bareHandler().message();
    expect(msg.embeds).toHaveLength(1);
  });
});

// ── Branding (withoutAuthor when no branding) ─────────────────────────────────

describe('EmbedHandler — null branding', () => {
  it('produces no author when branding is null and no .author() called', () => {
    const embed = buildEmbed((h) => h);
    expect(embed.author).toBeUndefined();
  });

  it('produces no footer when branding is null and no footer set', () => {
    const embed = buildEmbed((h) => h);
    expect(embed.footer).toBeUndefined();
  });
});
