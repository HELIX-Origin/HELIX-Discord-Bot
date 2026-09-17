/**
 * tests/unit/embeds/variants.test.ts
 *
 * Unit tests for embed variant styles and the variantStyle() accessor.
 */
import { describe, it, expect } from 'vitest';
import { EMBED_VARIANTS, variantStyle, type EmbedVariant } from '../../../src/bot/lib/embeds/variants.js';
import { EMBED_COLORS } from '../../../src/bot/utils/embeds.js';

const VARIANTS: EmbedVariant[] = ['primary', 'success', 'error', 'warning', 'info'];

describe('EMBED_VARIANTS', () => {
  it('defines all five variants', () => {
    for (const v of VARIANTS) {
      expect(EMBED_VARIANTS[v]).toBeDefined();
    }
  });

  it('each variant has a color and an emoji', () => {
    for (const v of VARIANTS) {
      const style = EMBED_VARIANTS[v];
      expect(typeof style.color).toBe('number');
      expect(typeof style.emoji).toBe('string');
    }
  });

  it('primary variant uses the PRIMARY brand color', () => {
    expect(EMBED_VARIANTS.primary.color).toBe(EMBED_COLORS.PRIMARY);
  });

  it('success variant uses the SUCCESS color', () => {
    expect(EMBED_VARIANTS.success.color).toBe(EMBED_COLORS.SUCCESS);
  });

  it('error variant uses the ERROR color', () => {
    expect(EMBED_VARIANTS.error.color).toBe(EMBED_COLORS.ERROR);
  });

  it('warning variant uses the WARNING color', () => {
    expect(EMBED_VARIANTS.warning.color).toBe(EMBED_COLORS.WARNING);
  });

  it('info variant uses the INFO color', () => {
    expect(EMBED_VARIANTS.info.color).toBe(EMBED_COLORS.INFO);
  });
});

describe('variantStyle()', () => {
  it('returns the correct style for each variant', () => {
    for (const v of VARIANTS) {
      expect(variantStyle(v)).toStrictEqual(EMBED_VARIANTS[v]);
    }
  });
});
