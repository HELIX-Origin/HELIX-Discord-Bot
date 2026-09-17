/**
 * tests/unit/feed/html.test.ts
 *
 * Unit tests for HTML-processing utilities in src/feed/parser.ts:
 *   - decodeHtmlEntities()
 *   - stripHtml()
 *   - extractImageFromHtml()
 *
 * And the embed HTML utilities in src/bot/utils/embeds.ts:
 *   - extractDescriptionAndLinks()
 *
 * No network access or Discord connection required.
 */
import { describe, it, expect } from 'vitest';
import {
  decodeHtmlEntities,
  stripHtml,
  extractImageFromHtml,
} from '../../../src/feed/parser.js';
import { extractDescriptionAndLinks } from '../../../src/bot/utils/embeds.js';

// ── decodeHtmlEntities() ──────────────────────────────────────────────────────

describe('decodeHtmlEntities()', () => {
  it('decodes &amp; → &', () => expect(decodeHtmlEntities('&amp;')).toBe('&'));
  it('decodes &lt; → <', () => expect(decodeHtmlEntities('&lt;')).toBe('<'));
  it('decodes &gt; → >', () => expect(decodeHtmlEntities('&gt;')).toBe('>'));
  it('decodes &quot; → "', () => expect(decodeHtmlEntities('&quot;')).toBe('"'));
  it("decodes &apos; → '", () => expect(decodeHtmlEntities('&apos;')).toBe("'"));
  it('decodes &nbsp; → space', () => expect(decodeHtmlEntities('&nbsp;')).toBe(' '));

  it('decodes typography entities', () => {
    expect(decodeHtmlEntities('&mdash;')).toBe('—');
    expect(decodeHtmlEntities('&ndash;')).toBe('–');
    expect(decodeHtmlEntities('&hellip;')).toBe('…');
  });

  it('decodes smart quotes', () => {
    expect(decodeHtmlEntities('&lsquo;&rsquo;')).toBe('\u2018\u2019');
    expect(decodeHtmlEntities('&ldquo;&rdquo;')).toBe('\u201c\u201d');
  });

  it('decodes decimal numeric entities (&#65; → A)', () => {
    expect(decodeHtmlEntities('&#65;&#66;&#67;')).toBe('ABC');
  });

  it('decodes hexadecimal numeric entities (&#x41; → A)', () => {
    expect(decodeHtmlEntities('&#x41;&#x42;&#x43;')).toBe('ABC');
  });

  it('decodes mixed entities in a single string', () => {
    expect(decodeHtmlEntities('Hello &amp; World &mdash; it&rsquo;s great')).toBe(
      "Hello & World — it\u2019s great",
    );
  });

  it('leaves plain text unchanged', () => {
    expect(decodeHtmlEntities('no entities here')).toBe('no entities here');
  });

  it('handles consecutive entities without gaps', () => {
    expect(decodeHtmlEntities('&lt;b&gt;bold&lt;/b&gt;')).toBe('<b>bold</b>');
  });
});

// ── stripHtml() ───────────────────────────────────────────────────────────────

describe('stripHtml()', () => {
  it('returns null for null input', () => {
    expect(stripHtml(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(stripHtml('')).toBeNull();
  });

  it('strips simple HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
  });

  it('removes entire <script> blocks including their content', () => {
    const result = stripHtml('<script>alert("xss")</script>Safe text');
    expect(result).not.toContain('alert');
    expect(result).toContain('Safe text');
  });

  it('removes entire <style> blocks including their content', () => {
    const result = stripHtml('<style>.red { color: red; }</style>Body text');
    expect(result).not.toContain('color');
    expect(result).toContain('Body text');
  });

  it('collapses multiple spaces into one', () => {
    expect(stripHtml('<p>too    many   spaces</p>')).toBe('too many spaces');
  });

  it('decodes HTML entities after stripping tags', () => {
    expect(stripHtml('<p>Hello &amp; World</p>')).toBe('Hello & World');
  });

  it('handles self-closing tags', () => {
    expect(stripHtml('Line 1<br />Line 2')).toBe('Line 1 Line 2');
  });

  it('handles deeply nested tags', () => {
    expect(stripHtml('<div><p><span>Deep text</span></p></div>')).toBe('Deep text');
  });
});

// ── extractImageFromHtml() ────────────────────────────────────────────────────

describe('extractImageFromHtml()', () => {
  it('returns null for null input', () => {
    expect(extractImageFromHtml(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractImageFromHtml('')).toBeNull();
  });

  it('extracts image URL from an <img src="..."> tag', () => {
    const html = '<img src="https://cdn.example.com/photo.jpg" alt="photo" />';
    expect(extractImageFromHtml(html)).toBe('https://cdn.example.com/photo.jpg');
  });

  it('skips tracking pixels (1x1 in URL) regardless of extension', () => {
    // isTrackingPixel() checks the URL itself for "1x1", "pixel", "beacon" etc.
    // The dimension attributes (width="1") are only checked in the <img> fallback path.
    const html = '<img src="https://example.com/1x1.jpg" />';
    expect(extractImageFromHtml(html)).toBeNull();
  });

  it('skips tracking pixel URLs even without size attributes', () => {
    const html = '<img src="https://example.com/1x1.gif" />';
    expect(extractImageFromHtml(html)).toBeNull();
  });

  it('extracts image from <a href> when it points to a known image extension', () => {
    const html = '<a href="https://i.redd.it/abc123.jpg">[link]</a>';
    expect(extractImageFromHtml(html)).toBe('https://i.redd.it/abc123.jpg');
  });

  it('prioritizes animated GIF href over static <img src>', () => {
    const html =
      '<img src="https://cdn.example.com/static.jpg" />' +
      '<a href="https://i.imgur.com/XYZ.gif">View gif</a>';
    const result = extractImageFromHtml(html);
    expect(result).toContain('.gif');
  });

  it('returns first non-tracking image when multiple are present', () => {
    const html =
      '<img src="https://example.com/beacon.gif" width="1" height="1" />' +
      '<img src="https://cdn.example.com/real.jpg" />';
    expect(extractImageFromHtml(html)).toBe('https://cdn.example.com/real.jpg');
  });

  it('normalizes imgur .gifv URLs to .gif', () => {
    const html = '<a href="https://i.imgur.com/AbCdEfG.gifv">gif</a>';
    const result = extractImageFromHtml(html);
    expect(result).toBe('https://i.imgur.com/AbCdEfG.gif');
  });
});

// ── extractDescriptionAndLinks() ──────────────────────────────────────────────

describe('extractDescriptionAndLinks()', () => {
  it('returns { description: null, links: [] } for null input', () => {
    const { description, links } = extractDescriptionAndLinks(null);
    expect(description).toBeNull();
    expect(links).toHaveLength(0);
  });

  it('extracts plain text from a <p> tag', () => {
    const { description } = extractDescriptionAndLinks('<p>Hello, world!</p>');
    expect(description).toContain('Hello, world!');
  });

  it('extracts a named link from an <a> tag', () => {
    const { links } = extractDescriptionAndLinks('<a href="https://example.com/article">Read more about it</a>');
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe('https://example.com/article');
    expect(links[0].label).toBe('Read more about it');
  });

  it('deduplicates identical URLs across multiple anchors', () => {
    const html =
      '<a href="https://example.com/p1">Article</a>' +
      '<a href="https://example.com/p1">Same URL again</a>';
    const { links } = extractDescriptionAndLinks(html);
    const matches = links.filter((l) => l.url === 'https://example.com/p1');
    expect(matches).toHaveLength(1);
  });

  it('normalizes boilerplate [link] anchor text to a readable label', () => {
    const html = '<a href="https://example.com/post">[link]</a>';
    const { links } = extractDescriptionAndLinks(html);
    if (links.length > 0) {
      expect(links[0].label).not.toBe('[link]');
    }
  });

  it('strips <style> and <script> content', () => {
    const html = '<style>.red{color:red}</style><script>alert(1)</script><p>Keep this</p>';
    const { description } = extractDescriptionAndLinks(html);
    expect(description).not.toContain('color:red');
    expect(description).not.toContain('alert');
    expect(description).toContain('Keep this');
  });

  it('truncates description to targetLength', () => {
    const longText = '<p>' + 'word '.repeat(200) + '</p>';
    const { description } = extractDescriptionAndLinks(longText, 100);
    expect((description ?? '').length).toBeLessThanOrEqual(102); // +1 for ellipsis
  });

  it('appends ellipsis when truncated', () => {
    const longText = '<p>' + 'word '.repeat(200) + '</p>';
    const { description } = extractDescriptionAndLinks(longText, 100);
    expect(description?.endsWith('…')).toBe(true);
  });

  it('ignores non-http links', () => {
    const html = '<a href="mailto:user@example.com">Email us</a>';
    const { links } = extractDescriptionAndLinks(html);
    const nonHttp = links.filter((l) => !l.url.startsWith('http'));
    expect(nonHttp).toHaveLength(0);
  });
});
