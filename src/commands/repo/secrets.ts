import pc from 'picocolors';
import { RepoManager } from '../../core/hosting/index.js';
import { logger } from '../../utils/logger/index.js';

export function syncRepoSecrets(options: { repo?: string; envPath?: string } = {}): void {
  logger.title('Synchronizing Local Environment to GitHub Secrets');

  const result = RepoManager.syncSecrets({
    repoName: options.repo,
    envPath: options.envPath,
  });

  if (result.syncedCount > 0) {
    logger.success(`Securely uploaded ${pc.bold(pc.cyan(result.syncedCount))} secret(s) to GitHub Secrets.`);
    console.log(pc.dim('  Keys and values were transmitted securely via stdin and are not exposed in commits or logs.\n'));
  } else if (result.errors.length > 0) {
    logger.error('Failed to sync secrets to GitHub:');
    for (const err of result.errors) {
      console.log(`  ${pc.red('•')} ${err}`);
    }
  } else {
    logger.info('No environment variables found in .env to synchronize.');
  }
}
