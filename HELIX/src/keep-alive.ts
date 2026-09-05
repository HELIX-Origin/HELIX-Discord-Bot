/**
 * HELIX Keep-Alive Service
 * ──────────────────────────────────────────────────────────────────────────
 * Autonomous background service that periodically pings the public
 * /api/health endpoint to prevent cloud hosting platforms (e.g. Render Free Tier)
 * from spinning down the service after 15 minutes of inactivity.
 *
 * Runs 100% in-process with zero external monitoring dependencies.
 * ──────────────────────────────────────────────────────────────────────────
 */

import pc from 'picocolors';
import { logs as logger } from './handlers/logs-handler.js';
import { getSelfPingConfig, SelfPingConfig } from './env.js';

export interface KeepAliveOptions {
  enabled?: boolean;
  targetUrl?: string | null;
  intervalMs?: number;
}

export interface KeepAliveStatus {
  enabled: boolean;
  targetUrl: string | null;
  intervalMs: number;
  lastPingTime: number | null;
  lastPingStatus: 'idle' | 'success' | 'failed';
  lastPingError: string | null;
  pingCount: number;
}

let keepAliveTimer: NodeJS.Timeout | null = null;
let initialTimeout: NodeJS.Timeout | null = null;

let keepAliveStatus: KeepAliveStatus = {
  enabled: false,
  targetUrl: null,
  intervalMs: 600_000,
  lastPingTime: null,
  lastPingStatus: 'idle',
  lastPingError: null,
  pingCount: 0,
};

/**
 * Returns current snapshot of Keep-Alive telemetry.
 */
export function getKeepAliveStatus(): KeepAliveStatus {
  return { ...keepAliveStatus };
}

/**
 * Executes a single keep-alive ping to the target endpoint.
 */
export async function pingOnce(targetUrl: string): Promise<boolean> {
  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'HELIX-KeepAlive-SelfPinger/1.0',
        'Accept': 'application/json, text/plain',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      keepAliveStatus.lastPingTime = Date.now();
      keepAliveStatus.lastPingStatus = 'success';
      keepAliveStatus.lastPingError = null;
      keepAliveStatus.pingCount++;
      return true;
    } else {
      keepAliveStatus.lastPingTime = Date.now();
      keepAliveStatus.lastPingStatus = 'failed';
      keepAliveStatus.lastPingError = `HTTP ${res.status}: ${res.statusText}`;
      logger.warn(`Keep-alive self-ping warning: ${targetUrl} returned HTTP ${res.status}`);
      return false;
    }
  } catch (err: any) {
    keepAliveStatus.lastPingTime = Date.now();
    keepAliveStatus.lastPingStatus = 'failed';
    keepAliveStatus.lastPingError = err?.message || 'Unknown network error';
    logger.warn(`Keep-alive self-ping request failed: ${err?.message || err}`);
    return false;
  }
}

/**
 * Starts the autonomous Keep-Alive Self-Ping service.
 */
export function startKeepAlive(options: KeepAliveOptions = {}): void {
  // Clear any existing timer
  stopKeepAlive();

  const envConfig: SelfPingConfig = getSelfPingConfig();
  const enabled = options.enabled !== undefined ? options.enabled : envConfig.enabled;
  const targetUrl = options.targetUrl !== undefined ? options.targetUrl : envConfig.targetUrl;
  const intervalMs = options.intervalMs || envConfig.intervalMs;

  keepAliveStatus = {
    enabled: Boolean(enabled && targetUrl),
    targetUrl: targetUrl || null,
    intervalMs,
    lastPingTime: null,
    lastPingStatus: 'idle',
    lastPingError: null,
    pingCount: 0,
  };

  if (!keepAliveStatus.enabled || !keepAliveStatus.targetUrl) {
    return;
  }

  const activeUrl = keepAliveStatus.targetUrl;
  logger.info(`Autonomous Keep-Alive Service started (${Math.round(intervalMs / 60000)}m interval): ${pc.cyan(activeUrl)}`);

  // Initial grace period ping
  initialTimeout = setTimeout(() => {
    if (keepAliveStatus.enabled && activeUrl) {
      pingOnce(activeUrl).catch(() => {});
    }
  }, 5000);

  if (initialTimeout.unref) {
    initialTimeout.unref();
  }

  // Periodic keep-alive ping loop
  keepAliveTimer = setInterval(() => {
    if (keepAliveStatus.enabled && activeUrl) {
      pingOnce(activeUrl).catch(() => {});
    }
  }, intervalMs);

  if (keepAliveTimer.unref) {
    keepAliveTimer.unref();
  }
}

/**
 * Stops the Keep-Alive service and clears active intervals.
 */
export function stopKeepAlive(): void {
  if (initialTimeout) {
    clearTimeout(initialTimeout);
    initialTimeout = null;
  }
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  keepAliveStatus.enabled = false;
}

/**
 * Test helper to cleanly reset state across test suites.
 */
export function resetKeepAliveForTest(): void {
  stopKeepAlive();
  keepAliveStatus = {
    enabled: false,
    targetUrl: null,
    intervalMs: 600_000,
    lastPingTime: null,
    lastPingStatus: 'idle',
    lastPingError: null,
    pingCount: 0,
  };
}
