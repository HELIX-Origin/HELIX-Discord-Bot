import pc from 'picocolors';
import { RepoManager } from '../../core/hosting/index.js';
import { logger } from '../../utils/logger/index.js';

export function showRepoStatus(): void {
  logger.title('Code Hosting Platforms & Official CLI Status');
  logger.dim('Checks for installed official CLIs and active authentication sessions\n');

  const statuses = RepoManager.checkAll();

  for (const s of statuses) {
    const cliIcon = s.cliInstalled ? pc.green('✔') : pc.yellow('○');
    const authLabel = s.authenticated
      ? pc.green(pc.bold('READY'))
      : pc.yellow(pc.bold('NOT LOGGED IN'));

    console.log(`  ${cliIcon} ${pc.bold(s.name.padEnd(16))} [CLI: ${s.cliCommand} ${s.cliInstalled ? 'installed' : 'missing'}] - ${authLabel}`);
    console.log(`    ${pc.dim(s.authDetail)}`);
    console.log();
  }
}
