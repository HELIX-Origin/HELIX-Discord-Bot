import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

export function isGitHubCliInstalled(): boolean {
  try {
    execSync('gh --version', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export function isGitHubCliAuthenticated(): boolean {
  try {
    execSync('gh auth status', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export function createGitHubRepo(
  repoName: string,
  visibility: 'public' | 'private',
  cwd: string
): { success: boolean; message: string } {
  if (!isGitHubCliInstalled()) {
    return { success: false, message: 'GitHub CLI (gh) is not installed in PATH' };
  }
  if (!isGitHubCliAuthenticated()) {
    return { success: false, message: 'GitHub CLI is not logged in. Run "gh auth login" first' };
  }

  try {
    const flag = visibility === 'private' ? '--private' : '--public';
    execSync(`gh repo create ${repoName} ${flag} --source=. --remote=origin --push`, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      timeout: 30000,
    });

    // Automatically sync .env secrets to GitHub repository secrets if .env exists
    const secretSyncResult = syncGitHubSecrets(repoName, cwd);

    return {
      success: true,
      message: `Successfully created GitHub repository: ${repoName}${secretSyncResult.syncedCount > 0 ? ` (${secretSyncResult.syncedCount} secrets securely uploaded to GitHub Secrets)` : ''}`,
    };
  } catch (err: any) {
    return { success: false, message: err.stderr || err.message || 'Failed to create GitHub repository' };
  }
}

export function syncGitHubSecrets(
  repoName?: string,
  cwd: string = process.cwd(),
  customEnvPath?: string
): { success: boolean; syncedCount: number; errors: string[] } {
  if (!isGitHubCliInstalled() || !isGitHubCliAuthenticated()) {
    return { success: false, syncedCount: 0, errors: ['GitHub CLI (gh) not installed or authenticated'] };
  }

  const envPath = customEnvPath || path.resolve(cwd, '.env');
  if (!fs.existsSync(envPath)) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  let parsed: Record<string, string> = {};
  try {
    const raw = fs.readFileSync(envPath, 'utf-8');
    parsed = dotenv.parse(raw);
  } catch (err: any) {
    return { success: false, syncedCount: 0, errors: [err.message] };
  }

  const keys = Object.keys(parsed);
  if (keys.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const key of keys) {
    const value = parsed[key];
    if (!value || value.trim() === '') continue;

    try {
      // Pass value securely via stdin without displaying in shell process list
      const repoFlag = repoName ? `-R ${repoName}` : '';
      execSync(`gh secret set ${key} ${repoFlag}`, {
        input: value,
        cwd,
        stdio: ['pipe', 'ignore', 'pipe'],
        timeout: 10000,
      });
      syncedCount++;
    } catch (err: any) {
      errors.push(`Failed to set secret ${key}: ${err.message}`);
    }
  }

  return { success: errors.length === 0, syncedCount, errors };
}

