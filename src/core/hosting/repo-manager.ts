import { execSync } from 'child_process';
import { isGitHubCliInstalled, isGitHubCliAuthenticated, createGitHubRepo, syncGitHubSecrets } from './github.js';
import { isGitLabCliInstalled, isGitLabCliAuthenticated, createGitLabRepo } from './gitlab.js';
import { getBitbucketStatus } from './bitbucket.js';

export interface CodeHostingStatus {
  platform: 'github' | 'gitlab' | 'bitbucket' | 'git';
  name: string;
  cliInstalled: boolean;
  cliCommand: string;
  authenticated: boolean;
  authDetail: string;
}

export class RepoManager {
  private static run(cmd: string, cwd?: string): string {
    return execSync(cmd, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
      cwd: cwd || process.cwd(),
      timeout: 10000,
    }).trim();
  }

  public static isGitInstalled(): boolean {
    try {
      execSync('git --version', { stdio: 'ignore', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  public static checkGitHub(): CodeHostingStatus {
    const installed = isGitHubCliInstalled();
    const auth = installed && isGitHubCliAuthenticated();
    return {
      platform: 'github',
      name: 'GitHub',
      cliInstalled: installed,
      cliCommand: 'gh',
      authenticated: auth,
      authDetail: installed
        ? auth
          ? 'Authenticated via GitHub CLI'
          : 'Installed, but not logged in (run "gh auth login")'
        : 'GitHub CLI (gh) not found in PATH',
    };
  }

  public static checkGitLab(): CodeHostingStatus {
    const installed = isGitLabCliInstalled();
    const auth = installed && isGitLabCliAuthenticated();
    return {
      platform: 'gitlab',
      name: 'GitLab',
      cliInstalled: installed,
      cliCommand: 'glab',
      authenticated: auth,
      authDetail: installed
        ? auth
          ? 'Authenticated via GitLab CLI'
          : 'Installed, but not logged in (run "glab auth login")'
        : 'GitLab CLI (glab) not found in PATH',
    };
  }

  public static checkBitbucket(): CodeHostingStatus {
    const bb = getBitbucketStatus();
    return {
      platform: 'bitbucket',
      name: 'Bitbucket',
      cliInstalled: this.isGitInstalled(),
      cliCommand: 'git',
      authenticated: bb.authenticated,
      authDetail: bb.authDetail,
    };
  }

  public static checkAll(): CodeHostingStatus[] {
    return [
      this.checkGitHub(),
      this.checkGitLab(),
      this.checkBitbucket(),
    ];
  }

  public static initLocalGit(cwd: string): void {
    try {
      this.run('git init -b main', cwd);
    } catch {
      this.run('git init', cwd);
    }
  }

  public static createRemoteRepo(options: {
    platform: 'github' | 'gitlab' | 'bitbucket';
    repoName: string;
    visibility: 'public' | 'private';
    cwd: string;
  }): { success: boolean; message: string } {
    const { platform, repoName, visibility, cwd } = options;

    if (!this.isGitInstalled()) {
      return { success: false, message: 'Git is not installed on this system' };
    }

    try {
      // Stage and initial commit if files exist
      try {
        this.run('git add .', cwd);
        this.run('git commit -m "Initial commit from HELIX CLI"', cwd);
      } catch {}

      if (platform === 'github') {
        return createGitHubRepo(repoName, visibility, cwd);
      } else if (platform === 'gitlab') {
        return createGitLabRepo(repoName, visibility, cwd);
      } else {
        return {
          success: true,
          message: 'Local Git repository initialized. Add Bitbucket remote via: git remote add origin <url>',
        };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to create remote repository' };
    }
  }

  public static syncSecrets(options: {
    repoName?: string;
    cwd?: string;
    envPath?: string;
  } = {}): { success: boolean; syncedCount: number; errors: string[] } {
    return syncGitHubSecrets(options.repoName, options.cwd, options.envPath);
  }
}
