import { execSync } from 'child_process';

export function isGitLabCliInstalled(): boolean {
  try {
    execSync('glab --version', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export function isGitLabCliAuthenticated(): boolean {
  try {
    execSync('glab auth status', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export function createGitLabRepo(
  repoName: string,
  visibility: 'public' | 'private',
  cwd: string
): { success: boolean; message: string } {
  if (!isGitLabCliInstalled()) {
    return { success: false, message: 'GitLab CLI (glab) is not installed in PATH' };
  }
  if (!isGitLabCliAuthenticated()) {
    return { success: false, message: 'GitLab CLI is not logged in. Run "glab auth login" first' };
  }

  try {
    const flag = visibility === 'private' ? '--private' : '--public';
    execSync(`glab repo create ${repoName} ${flag} --remote=origin --push`, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      timeout: 30000,
    });
    return { success: true, message: `Successfully created GitLab repository: ${repoName}` };
  } catch (err: any) {
    return { success: false, message: err.stderr || err.message || 'Failed to create GitLab repository' };
  }
}
