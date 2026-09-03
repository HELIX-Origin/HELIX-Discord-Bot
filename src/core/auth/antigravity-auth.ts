import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { AuthResult, maskToken } from './copilot-auth.js';

export function resolveAntigravityAuth(): AuthResult {
  // 1. Check local Antigravity configuration directory
  const geminiDir = path.join(os.homedir(), '.gemini', 'antigravity');
  const hasClientDir = fs.existsSync(geminiDir);

  // Check if agy CLI is installed in PATH
  let hasAgyCli = false;
  try {
    const cmd = process.platform === 'win32' ? 'where.exe agy' : 'which agy';
    const res = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf-8', timeout: 3000 }).trim();
    if (res) hasAgyCli = true;
  } catch {}

  if (hasAgyCli || hasClientDir) {
    return {
      authenticated: true,
      source: 'client-cli (agy)',
      detail: `Installed client session detected (${hasClientDir ? geminiDir : 'agy in PATH'})`,
    };
  }

  // 2. Fallback to environment variables
  const envKey = process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY;
  if (envKey) {
    return {
      authenticated: true,
      source: '.env / process.env',
      detail: 'Authenticated via environment variable (ANTIGRAVITY_API_KEY / GEMINI_API_KEY)',
      tokenPreview: maskToken(envKey),
    };
  }

  return {
    authenticated: false,
    source: 'none',
    detail: 'Antigravity client not detected, ANTIGRAVITY_API_KEY not found in .env',
  };
}
