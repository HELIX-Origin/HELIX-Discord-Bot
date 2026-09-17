/**
 * tests/unit/feed/images.test.ts
 *
 * Unit tests for image URL utilities in src/feed/parser.ts:
 *   - isTrackingPixel()
 *   - normalizeImageUrl()
 *
 * And the embed image validator in src/bot/utils/embeds.ts:
 *   - isValidEmbedImageUrl()
 *
 * No network access required.
 */
import { describe, it, expect } from 'vitest';
import { isTrackingPixel, normalizeImageUrl } from '../../../src/feed/parser.js';
import { isValidEmbedImageUrl } from '../../../src/bot/utils/embeds.js';

// ── isTrackingPixel() ─────────────────────────────────────────────────────────

describe('isTrackingPixel()', () => {
  // True cases — tracking URLs
  it('flags URLs containing "1x1"', () => {
    expect(isTrackingPixel('https://example.com/1x1.gif')).toBe(true);
    expect(isTrackingPixel('https://stats.example.com/track/1x1.png')).toBe(true);
  });

  it('flags URLs containing "pixel"', () => {
    expect(isTrackingPixel('https://example.com/pixel.png')).toBe(true);
    expect(isTrackingPixel('https://track.example.com/pixel_tracker.gif')).toBe(true);
  });

  it('flags URLs containing "tracking"', () => {
    expect(isTrackingPixel('https://example.com/tracking.gif')).toBe(true);
  });

  it('flags URLs containing "beacon"', () => {
    expect(isTrackingPixel('https://example.com/beacon?id=abc')).toBe(true);
  });

  it('flags feedburner tracking paths', () => {
    expect(isTrackingPixel('https://feedburner.com/~r/feedname/1')).toBe(true);
  });

  it('flags feedsportal URLs', () => {
    expect(isTrackingPixel('https://feedsportal.com/c/1234/feed/img')).toBe(true);
  });

  // False cases — legitimate image URLs
  it('does not flag normal CDN image URLs', () => {
    expect(isTrackingPixel('https://cdn.example.com/banner.jpg')).toBe(false);
    expect(isTrackingPixel('https://i.redd.it/abc123.jpg')).toBe(false);
    expect(isTrackingPixel('https://i.imgur.com/AbCdEfG.gif')).toBe(false);
  });

  it('does not flag Reddit image URLs', () => {
    expect(isTrackingPixel('https://preview.redd.it/photo.jpg?auto=webp')).toBe(false);
  });

  it('does not flag YouTube thumbnail URLs', () => {
    expect(isTrackingPixel('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg')).toBe(false);
  });
});

// ── normalizeImageUrl() ───────────────────────────────────────────────────────

describe('normalizeImageUrl()', () => {
  // Null / non-URL inputs
  it('returns null for null', () => expect(normalizeImageUrl(null)).toBeNull());
  it('returns null for undefined', () => expect(normalizeImageUrl(undefined)).toBeNull());
  it('returns null for empty string', () => expect(normalizeImageUrl('')).toBeNull());
  it('returns null for non-http URL (ftp)', () => {
    expect(normalizeImageUrl('ftp://example.com/img.png')).toBeNull();
  });
  it('returns null for data URIs', () => {
    expect(normalizeImageUrl('data:image/png;base64,abc=')).toBeNull();
  });

  // Imgur normalization
  it('converts imgur .gifv → direct .gif', () => {
    expect(normalizeImageUrl('https://i.imgur.com/AbCdEfG.gifv')).toBe(
      'https://i.imgur.com/AbCdEfG.gif',
    );
  });

  it('converts imgur .mp4 → direct .gif', () => {
    expect(normalizeImageUrl('https://i.imgur.com/AbCdEfG.mp4')).toBe(
      'https://i.imgur.com/AbCdEfG.gif',
    );
  });

  it('converts bare imgur.com .gif → i.imgur.com .gif', () => {
    expect(normalizeImageUrl('https://imgur.com/AbCdEfG.gif')).toBe(
      'https://i.imgur.com/AbCdEfG.gif',
    );
  });

  it('converts imgur .gifv with query string', () => {
    const result = normalizeImageUrl('https://i.imgur.com/AbCdEfG.gifv?play=1');
    expect(result).toBe('https://i.imgur.com/AbCdEfG.gif');
  });

  // Giphy normalization
  it('converts giphy page link → direct media .gif', () => {
    const result = normalizeImageUrl('https://giphy.com/gifs/funny-cat-AbCdEfG123');
    expect(result).toContain('media.giphy.com');
    expect(result).toContain('.gif');
  });

  // Gfycat normalization
  it('converts gfycat page link → thumb .gif', () => {
    const result = normalizeImageUrl('https://gfycat.com/CoolAnimatedThing');
    expect(result).toContain('thumbs.gfycat.com');
    expect(result).toContain('-size_restricted.gif');
  });

  // HTML entity decoding
  it('decodes HTML entities in the URL', () => {
    const result = normalizeImageUrl('https://cdn.example.com/image&amp;size=large.jpg');
    expect(result).toBe('https://cdn.example.com/image&size=large.jpg');
  });

  // Passthrough for normal URLs
  it('returns a plain https image URL unchanged', () => {
    const url = 'https://cdn.example.com/photo.jpg';
    expect(normalizeImageUrl(url)).toBe(url);
  });

  it('returns a plain http image URL unchanged', () => {
    const url = 'http://cdn.example.com/photo.png';
    expect(normalizeImageUrl(url)).toBe(url);
  });
});

// ── isValidEmbedImageUrl() ────────────────────────────────────────────────────

describe('isValidEmbedImageUrl()', () => {
  // Falsy / null inputs
  it('returns false for null', () => expect(isValidEmbedImageUrl(null)).toBe(false));
  it('returns false for undefined', () => expect(isValidEmbedImageUrl(undefined)).toBe(false));
  it('returns false for empty string', () => expect(isValidEmbedImageUrl('')).toBe(false));

  // Protocol check
  it('returns false for non-http URLs', () => {
    expect(isValidEmbedImageUrl('ftp://example.com/img.png')).toBe(false);
    expect(isValidEmbedImageUrl('data:image/gif;base64,R0lGO')).toBe(false);
  });

  // SVG
  it('returns false for SVG files (not supported in embeds)', () => {
    expect(isValidEmbedImageUrl('https://example.com/icon.svg')).toBe(false);
  });

  // Known bad patterns
  it('returns false for 1x1 URLs', () => {
    expect(isValidEmbedImageUrl('https://example.com/1x1.gif')).toBe(false);
  });

  it('returns false for feedburner tracking URLs', () => {
    expect(isValidEmbedImageUrl('https://feedburner.com/~r/feed/1')).toBe(false);
  });

  it('returns false for feedsportal URLs', () => {
    expect(isValidEmbedImageUrl('https://feedsportal.com/img.png')).toBe(false);
  });

  it('returns false for statcounter URLs', () => {
    expect(isValidEmbedImageUrl('https://statcounter.com/count.gif')).toBe(false);
  });

  it('returns false for gravatar default avatar', () => {
    expect(isValidEmbedImageUrl('https://gravatar.com/avatar/default')).toBe(false);
  });

  it('returns false for data: URIs in the value', () => {
    expect(isValidEmbedImageUrl('https://example.com/data:image/png')).toBe(false);
  });

  it('returns false for spacer.gif', () => {
    expect(isValidEmbedImageUrl('https://example.com/spacer.gif')).toBe(false);
  });

  it('returns false for pixel.gif', () => {
    expect(isValidEmbedImageUrl('https://example.com/pixel.gif')).toBe(false);
  });

  // Valid image URLs
  it('returns true for a valid JPEG URL', () => {
    expect(isValidEmbedImageUrl('https://cdn.example.com/photo.jpg')).toBe(true);
  });

  it('returns true for a valid PNG URL', () => {
    expect(isValidEmbedImageUrl('https://cdn.example.com/photo.png')).toBe(true);
  });

  it('returns true for a valid GIF URL', () => {
    expect(isValidEmbedImageUrl('https://i.imgur.com/AbCdEfG.gif')).toBe(true);
  });

  it('returns true for a valid WebP URL', () => {
    expect(isValidEmbedImageUrl('https://cdn.example.com/image.webp')).toBe(true);
  });

  it('returns true for a Reddit CDN image', () => {
    expect(isValidEmbedImageUrl('https://i.redd.it/abc123.jpg')).toBe(true);
  });

  it('returns true for a URL with query parameters', () => {
    expect(isValidEmbedImageUrl('https://cdn.example.com/img.jpg?w=800&h=600')).toBe(true);
  });
});
