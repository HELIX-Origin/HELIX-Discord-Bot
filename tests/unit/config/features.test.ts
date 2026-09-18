/**
 * tests/unit/config/features.test.ts
 *
 * Unit tests for feature flag configuration defaults and overrides.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defaultConfig } from '../../../src/config.js';

describe('defaultConfig feature flags', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
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

  it('keeps core features enabled by default', () => {
    const config = defaultConfig();
    expect(config.features.feedsEnabled).toBe(true);
    expect(config.features.streamAlertsEnabled).toBe(true);
    expect(config.features.threadsEnabled).toBe(true);
    expect(config.features.administrationEnabled).toBe(true);
    expect(config.features.dashboardEnabled).toBe(true);
    expect(config.features.adminPanelEnabled).toBe(true);
  });

  it('allows disabling features via environment variables', () => {
    process.env['FEEDS_ENABLED'] = 'false';
    process.env['STREAM_ALERTS_ENABLED'] = 'false';
    process.env['ADMINISTRATION_ENABLED'] = 'false';
    const config = defaultConfig();
    expect(config.features.feedsEnabled).toBe(false);
    expect(config.features.streamAlertsEnabled).toBe(false);
    expect(config.features.administrationEnabled).toBe(false);
    expect(config.features.threadsEnabled).toBe(true);
  });
});
