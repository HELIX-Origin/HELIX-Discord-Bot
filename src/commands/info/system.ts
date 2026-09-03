import os from 'os';
import pc from 'picocolors';
import { execSync } from 'child_process';
import { logger } from '../../utils/logger/index.js';
import { showBanner } from '../../utils/banner/index.js';

export function showSystemInfo(): void {
  showBanner();
  logger.title('System & Runtime Information:');

  const infoRow = (label: string, value: string) => {
    console.log(`  ${pc.bold(label.padEnd(26))} ${pc.dim(value)}`);
  };

  const getCliVersion = (cmd: string): string => {
    try {
      return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf-8' }).trim().split('\n')[0];
    } catch {
      return pc.yellow('Not installed');
    }
  };

  infoRow('HELIX CLI Version', '0.1.0 (Modular Engine)');
  infoRow('Operating System', `${process.platform} (${os.release()}) ${os.arch()}`);
  infoRow('Node.js Runtime', process.version);
  infoRow('User Home Directory', os.homedir());
  infoRow('Current Workspace', process.cwd());

  logger.title('Detected Platform & Tooling CLIs:');
  infoRow('Git', getCliVersion('git --version'));
  infoRow('GitHub CLI (gh)', getCliVersion('gh --version'));
  infoRow('GitLab CLI (glab)', getCliVersion('glab --version'));
  infoRow('Antigravity CLI (agy)', getCliVersion('agy --version'));
  infoRow('Rust (cargo)', getCliVersion('cargo --version'));
  infoRow('Go', getCliVersion('go version'));
  infoRow('Python', getCliVersion('python --version'));
  infoRow('Flutter', getCliVersion('flutter --version'));

  console.log();
}
