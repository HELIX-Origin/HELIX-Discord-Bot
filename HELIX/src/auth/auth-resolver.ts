import { BotDatabase } from '../db/database.js';

export interface ProviderAuthStatus {
  provider: 'copilot' | 'antigravity' | 'opencode';
  displayName: string;
  authenticated: boolean;
  sessionCount: number;
  source: string;
  detail: string;
}

/**
 * Masks a sensitive token for safe display (e.g. `gho_...cdef`).
 */
export function maskToken(token: string): string {
  if (!token || token.length < 8) return '***';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

const PROVIDER_META: ReadonlyArray<{ provider: 'copilot' | 'antigravity' | 'opencode'; displayName: string }> = [
  { provider: 'copilot', displayName: 'GitHub Copilot' },
  { provider: 'antigravity', displayName: 'Google Antigravity' },
  { provider: 'opencode', displayName: 'Open Code Go / Zen' },
];

/**
 * Auth status is derived entirely from per-member `/auth` sessions stored in
 * the internal SQLite database (`user_sessions` table). Personal API keys are set
 * exclusively through the bot command and are never sourced from the `.env` file
 * or the host environment.
 *
 * `resolveAll()` reports a bot-wide aggregate of stored sessions per provider.
 * Per-user access checks are performed directly via `BotDatabase.getUserSession(userId)`.
 */
export class AuthResolver {
  public static resolveAll(): ProviderAuthStatus[] {
    const db = BotDatabase.getInstance();
    const sessions = db.getAllUserSessions();

    return PROVIDER_META.map(({ provider, displayName }) => {
      const matching = sessions.filter(s => s.provider === provider);
      const authenticated = matching.length > 0;
      return {
        provider,
        displayName,
        authenticated,
        sessionCount: matching.length,
        source: authenticated ? 'sqlite user_sessions' : 'none',
        detail: authenticated
          ? `${matching.length} authenticated member session(s) stored`
          : `No /auth session stored for this provider`,
      };
    });
  }

  public static resolveCopilot(): ProviderAuthStatus {
    return AuthResolver.resolveAll().find(s => s.provider === 'copilot')!;
  }

  public static resolveAntigravity(): ProviderAuthStatus {
    return AuthResolver.resolveAll().find(s => s.provider === 'antigravity')!;
  }

  public static resolveOpenCode(): ProviderAuthStatus {
    return AuthResolver.resolveAll().find(s => s.provider === 'opencode')!;
  }
}
