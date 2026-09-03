import fs from 'fs';
import path from 'path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'url';
import { BotDatabase } from '../../../bot/src/db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

export interface CliExecutionOptions {
  userId?: string;
  provider?: string;
  envOverrides?: Record<string, string>;
  cwd?: string;
  timeout?: number;
}

export interface CliExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  userSessionUsed: boolean;
  providerUsed?: string;
}

export interface CliHostStatus {
  installed: boolean;
  binaryPath: string;
  repoUrl: string;
  version: string;
}

export class LocalCliRunner {
  /**
   * Resolves the active binary path for the bot-hosted local CLI copy.
   * Checks .cli/ directory first (cloned fork), then falls back to current project bin/dist.
   */
  public static resolveCliBinaryPath(): string {
    const customDir = process.env.HELIX_CLI_DIR || '.cli';
    const candidatePaths = [
      path.resolve(projectRoot, customDir, 'bin', 'helix.js'),
      path.resolve(projectRoot, customDir, 'dist', 'index.js'),
      path.resolve(projectRoot, 'bin', 'helix.js'),
      path.resolve(projectRoot, 'dist', 'index.js'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return path.resolve(projectRoot, 'bin', 'helix.js');
  }

  public static getRepoUrl(): string {
    return process.env.HELIX_CLI_REPO_URL || 'https://github.com/helix-cli/helix-cli.git';
  }

  public static getStatus(): CliHostStatus {
    const binaryPath = this.resolveCliBinaryPath();
    const installed = fs.existsSync(binaryPath);
    let version = '0.1.0';

    try {
      const db = BotDatabase.getInstance();
      const recordedVersion = db.getKv('cli_version');
      if (recordedVersion) version = recordedVersion;
    } catch {}

    return {
      installed,
      binaryPath,
      repoUrl: this.getRepoUrl(),
      version,
    };
  }

  /**
   * Executes a command using the bot-hosted local copy of the CLI,
   * injecting account-bound user credentials from SQLite if available.
   */
  public static async execute(
    args: string[],
    options: CliExecutionOptions = {}
  ): Promise<CliExecutionResult> {
    const binaryPath = this.resolveCliBinaryPath();
    const env: NodeJS.ProcessEnv = { ...process.env, ...options.envOverrides };
    let userSessionUsed = false;
    let providerUsed: string | undefined = options.provider;

    // Check if user has an active authenticated session in SQLite
    if (options.userId) {
      try {
        const db = BotDatabase.getInstance();
        const session = db.getUserSession(options.userId, options.provider);
        if (session && session.token) {
          userSessionUsed = true;
          providerUsed = session.provider;
          const prov = session.provider.toLowerCase();

          if (prov === 'antigravity' || prov === 'gemini') {
            env.ANTIGRAVITY_API_KEY = session.token;
            env.GEMINI_API_KEY = session.token;
          } else if (prov === 'copilot' || prov === 'github') {
            env.GITHUB_TOKEN = session.token;
            env.COPILOT_API_KEY = session.token;
          } else if (prov === 'opencode') {
            env.OPENCODE_API_KEY = session.token;
          }
        }
      } catch {}
    }

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(process.execPath, [binaryPath, ...args], {
        cwd: options.cwd || projectRoot,
        env,
        timeout: options.timeout || 30000,
      });

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (err) => {
        stderr += err.message;
        resolve({
          success: false,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: 1,
          userSessionUsed,
          providerUsed,
        });
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? 0,
          userSessionUsed,
          providerUsed,
        });
      });
    });
  }
}
