import dotenv from 'dotenv';
import { resolveCopilotAuth } from './copilot-auth.js';
import { resolveAntigravityAuth } from './antigravity-auth.js';
import { resolveOpenCodeAuth } from './opencode-auth.js';

dotenv.config();

export interface ProviderAuthStatus {
  provider: 'copilot' | 'antigravity' | 'opencode';
  displayName: string;
  authenticated: boolean;
  source: string;
  detail: string;
  tokenPreview?: string;
}

export class AuthResolver {
  public static resolveCopilot(): ProviderAuthStatus {
    const res = resolveCopilotAuth();
    return {
      provider: 'copilot',
      displayName: 'GitHub Copilot',
      ...res,
    };
  }

  public static resolveAntigravity(): ProviderAuthStatus {
    const res = resolveAntigravityAuth();
    return {
      provider: 'antigravity',
      displayName: 'Google Antigravity',
      ...res,
    };
  }

  public static resolveOpenCode(): ProviderAuthStatus {
    const res = resolveOpenCodeAuth();
    return {
      provider: 'opencode',
      displayName: 'Open Code Go / Zen',
      ...res,
    };
  }

  public static resolveAll(): ProviderAuthStatus[] {
    return [
      this.resolveCopilot(),
      this.resolveAntigravity(),
      this.resolveOpenCode(),
    ];
  }
}
