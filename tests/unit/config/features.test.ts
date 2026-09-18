/**
 * tests/unit/config/features.test.ts
 *
 * Unit tests for feature flag configuration defaults, verifying that
 * GIF commands are disabled by default (deprecated / broken upstream).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defaultConfig } from '../../../src/config.js';

describe('defaultConfig feature flags', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env['GIFS_ENABLED'];
    delete process.env['FEEDS_ENABLED'];
    delete process.env['STREAM_ALERTS_ENABLED'];
    delete process.env['THREADS_ENABLED'];
    delete process.env['ADMINISTRATION_ENABLED'];
    delete process.env['DASHBOARD_ENABLED'];
    delete process.env['ADMIN_PANEL_ENABLED'];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults gifsEnabled to false (broken & discontinued)', () => {
    const config = defaultConfig();
    expect(config.features.gifsEnabled).toBe(false);
  });

  it('keeps other core features enabled by default', () => {
    const config = defaultConfig();
    expect(config.features.feedsEnabled).toBe(true);
    expect(config.features.streamAlertsEnabled).toBe(true);
    expect(config.features.threadsEnabled).toBe(true);
    expect(config.features.administrationEnabled).toBe(true);
    expect(config.features.dashboardEnabled).toBe(true);
    expect(config.features.adminPanelEnabled).toBe(true);
  });

  it('allows explicitly enabling gifsEnabled when set to "true"', () => {
    process.env['GIFS_ENABLED'] = 'true';
    const config = defaultConfig();
    expect(config.features.gifsEnabled).toBe(true);
  });

  it('keeps gifsEnabled false when set to "false"', () => {
    process.env['GIFS_ENABLED'] = 'false';
    const config = defaultConfig();
    expect(config.features.gifsEnabled).toBe(false);
  });
});
