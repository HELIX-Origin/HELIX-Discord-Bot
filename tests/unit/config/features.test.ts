/**
 * tests/unit/config/features.test.ts
 *
 * Unit tests for feature flag configuration defaults and overrides.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defaultConfig } from '../../../src/config.js';


describe('defaultConfig feed category limits', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env['FEED_CATEGORY_LIMITS'];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults to the built-in caps when unset', () => {
    const config = defaultConfig();
    expect(config.feedCategoryLimits.rss).toBe(10);
    expect(config.feedCategoryLimits.reddit).toBe(10);
  });

  it('parses a custom category=value CSV override', () => {
    process.env['FEED_CATEGORY_LIMITS'] = 'rss=15,reddit=4';
    const config = defaultConfig();
    expect(config.feedCategoryLimits.rss).toBe(15);
    expect(config.feedCategoryLimits.reddit).toBe(4);
  });

  it('ignores unknown categories and malformed entries', () => {
    process.env['FEED_CATEGORY_LIMITS'] = 'rss=8,unknown=99,bogus,nope=abc';
    const config = defaultConfig();
    expect(config.feedCategoryLimits.rss).toBe(8);
    expect(config.feedCategoryLimits.reddit).toBe(10);
  });

  it('removes the cap for a category set to 0', () => {
    process.env['FEED_CATEGORY_LIMITS'] = 'reddit=0';
    const config = defaultConfig();
    expect(config.feedCategoryLimits.reddit).toBe(0);
    expect(config.feedCategoryLimits.rss).toBe(10);
  });
});
