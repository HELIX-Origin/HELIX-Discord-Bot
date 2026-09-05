import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  startKeepAlive,
  stopKeepAlive,
  getKeepAliveStatus,
  pingOnce,
  resetKeepAliveForTest,
} from '../../../HELIX/src/keep-alive.js';
import { EnvSandbox } from '../../helpers/env.js';

describe('KeepAliveService — autonomous self-ping engine', () => {
  let sandbox: EnvSandbox;

  beforeEach(() => {
    sandbox = new EnvSandbox();
    resetKeepAliveForTest();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    stopKeepAlive();
    resetKeepAliveForTest();
    sandbox.restore();
    vi.restoreAllMocks();
  });

  it('reports disabled standby status initially', () => {
    const status = getKeepAliveStatus();
    expect(status.enabled).toBe(false);
    expect(status.targetUrl).toBeNull();
    expect(status.lastPingStatus).toBe('idle');
    expect(status.pingCount).toBe(0);
  });

  it('pingOnce records success on HTTP 200 OK', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await pingOnce('https://bot.example.com/api/health');
    expect(result).toBe(true);

    const status = getKeepAliveStatus();
    expect(status.lastPingStatus).toBe('success');
    expect(status.lastPingError).toBeNull();
    expect(status.pingCount).toBe(1);
    expect(typeof status.lastPingTime).toBe('number');
  });

  it('pingOnce records failure on HTTP 503 error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await pingOnce('https://bot.example.com/api/health');
    expect(result).toBe(false);

    const status = getKeepAliveStatus();
    expect(status.lastPingStatus).toBe('failed');
    expect(status.lastPingError).toContain('HTTP 503');
    expect(status.pingCount).toBe(0);
  });

  it('pingOnce catches network rejections gracefully without throwing', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await pingOnce('https://bot.example.com/api/health');
    expect(result).toBe(false);

    const status = getKeepAliveStatus();
    expect(status.lastPingStatus).toBe('failed');
    expect(status.lastPingError).toBe('Connection timed out');
  });

  it('starts keep-alive when targetUrl is provided', () => {
    startKeepAlive({
      enabled: true,
      targetUrl: 'https://bot.example.com/api/health',
      intervalMs: 300_000,
    });

    const status = getKeepAliveStatus();
    expect(status.enabled).toBe(true);
    expect(status.targetUrl).toBe('https://bot.example.com/api/health');
    expect(status.intervalMs).toBe(300_000);
  });

  it('stops keep-alive cleanly', () => {
    startKeepAlive({
      enabled: true,
      targetUrl: 'https://bot.example.com/api/health',
    });

    expect(getKeepAliveStatus().enabled).toBe(true);
    stopKeepAlive();
    expect(getKeepAliveStatus().enabled).toBe(false);
  });

  it('auto-activates when public NEXTAUTH_URL is configured', () => {
    sandbox.set('NEXTAUTH_URL', 'https://helix-bot.example.com');
    startKeepAlive();

    const status = getKeepAliveStatus();
    expect(status.enabled).toBe(true);
    expect(status.targetUrl).toBe('https://helix-bot.example.com/api/health');
    expect(status.intervalMs).toBe(600_000);
  });

  it('respects HELIX_SELF_PING=false to disable self-ping', () => {
    sandbox.set('NEXTAUTH_URL', 'https://helix-bot.example.com');
    sandbox.set('HELIX_SELF_PING', 'false');
    startKeepAlive();

    const status = getKeepAliveStatus();
    expect(status.enabled).toBe(false);
  });
});
