/**
 * src/dashboard/config.ts
 *
 * Dashboard configuration & export handler.
 * Provides dashboard runtime settings, theme defaults, navigation definitions,
 * and helper functions for dashboard routes and views.
 */

import type { AppConfig } from '../config.js';
import type { AppDeps } from '../app.js';

/** Extracted dashboard runtime options derived from global AppConfig. */
export interface DashboardRuntimeConfig {
  port: number;
  host: string;
  internalUrl: string;
  publicBaseUrl: string | null;
  defaultTheme: string;
  landingPageEnabled: boolean;
  clientId: string | null;
  redirectUrl: string | null;
  callbackUrl: string | null;
}

/** Extracts the dashboard runtime options from global AppConfig. */
export function extractDashboardConfig(config: AppConfig): DashboardRuntimeConfig {
  return {
    port: config.port,
    host: config.host,
    internalUrl: config.internalUrl,
    publicBaseUrl: config.publicBaseUrl,
    defaultTheme: config.defaultTheme,
    landingPageEnabled: config.landingPageEnabled,
    clientId: config.clientId,
    redirectUrl: config.redirectUrl,
    callbackUrl: config.callbackUrl,
  };
}

/** Resolves the public-facing or internal base URL for dashboard links. */
export function resolveDashboardBaseUrl(deps: AppDeps): string {
  return deps.config.publicBaseUrl || deps.config.internalUrl;
}

/** Supported dashboard theme identifiers. */
export const DASHBOARD_THEMES = ['glassmorphism', 'dark', 'light', 'cyberpunk', 'dracula', 'nord', 'emerald'] as const;

export type DashboardTheme = (typeof DASHBOARD_THEMES)[number];
