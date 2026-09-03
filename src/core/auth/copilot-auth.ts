import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

export interface AuthResult {
  authenticated: boolean;
  source: string;
  detail: string;
  tokenPreview?: string;
}

export function maskToken(token: string): string {
  if (!token || token.length < 8) return '***';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function resolveCopilotAuth(): AuthResult {
  // 1. Check official GitHub CLI ('gh auth token')
  try {
    const ghToken = execSync('gh auth token', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
      timeout: 3000,
    }).trim();

    if (ghToken) {
      return {
        authenticated: true,
        source: 'client-cli (gh)',
        detail: 'Authenticated via installed GitHub CLI session',
        tokenPreview: maskToken(ghToken),
      };
    }
  } catch {}

  // 2. Check Copilot hosts.json config file
  const copilotConfigPath = process.platform === 'win32'
    ? path.join(process.env.APPDATA || '', 'GitHub Copilot', 'hosts.json')
    : path.join(os.homedir(), '.config', 'github-copilot', 'hosts.json');

  if (fs.existsSync(copilotConfigPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(copilotConfigPath, 'utf-8'));
      const token = raw['github.com']?.oauth_token;
      if (token) {
        return {
          authenticated: true,
          source: 'client-file (copilot)',
          detail: `Authenticated via Copilot config at ${copilotConfigPath}`,
          tokenPreview: maskToken(token),
        };
      }
    } catch {}
  }

  // 3. Fallback to .env / environment variables
  const envToken = process.env.GITHUB_TOKEN || process.env.COPILOT_API_KEY;
  if (envToken) {
    return {
      authenticated: true,
      source: '.env / process.env',
      detail: 'Authenticated via environment variable (GITHUB_TOKEN / COPILOT_API_KEY)',
      tokenPreview: maskToken(envToken),
    };
  }

  return {
    authenticated: false,
    source: 'none',
    detail: 'No active GitHub CLI login or GITHUB_TOKEN in .env',
  };
}
