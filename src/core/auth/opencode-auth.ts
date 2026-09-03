import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { AuthResult, maskToken } from './copilot-auth.js';

export function resolveOpenCodeAuth(): AuthResult {
  // 1. Check OpenCode config file
  const opencodeConfigPath = path.join(os.homedir(), '.opencode', 'auth.json');
  if (fs.existsSync(opencodeConfigPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(opencodeConfigPath, 'utf-8'));
      if (raw.token) {
        return {
          authenticated: true,
          source: 'client-file (opencode)',
          detail: `Authenticated via config at ${opencodeConfigPath}`,
          tokenPreview: maskToken(raw.token),
        };
      }
    } catch {}
  }

  // Check if opencode CLI is installed
  let hasOpencodeCli = false;
  try {
    const cmd = process.platform === 'win32' ? 'where.exe opencode' : 'which opencode';
    const res = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf-8', timeout: 3000 }).trim();
    if (res) hasOpencodeCli = true;
  } catch {}

  if (hasOpencodeCli) {
    return {
      authenticated: true,
      source: 'client-cli (opencode)',
      detail: 'Open Code CLI detected in PATH',
    };
  }

  // 2. Fallback to environment variable
  const envKey = process.env.OPENCODE_API_KEY;
  if (envKey) {
    return {
      authenticated: true,
      source: '.env / process.env',
      detail: 'Authenticated via OPENCODE_API_KEY in .env',
      tokenPreview: maskToken(envKey),
    };
  }

  return {
    authenticated: false,
    source: 'none',
    detail: 'Open Code client not detected, OPENCODE_API_KEY not found in .env',
  };
}
