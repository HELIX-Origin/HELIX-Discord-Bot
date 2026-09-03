import { showRepoStatus } from './status.js';
import { createRepoRemote } from './create.js';
import { syncRepoSecrets } from './secrets.js';
import { logger } from '../../utils/logger/index.js';

export async function repoCommand(
  action: string = 'status',
  options: { platform?: string; name?: string; visibility?: string; envPath?: string } = {}
): Promise<void> {
  if (action === 'status') {
    showRepoStatus();
  } else if (action === 'create') {
    createRepoRemote(options);
  } else if (action === 'sync-secrets' || action === 'secrets') {
    syncRepoSecrets({ repo: options.name, envPath: options.envPath });
  } else {
    logger.error(`Unknown repo action: "${action}". Valid actions: status, create, sync-secrets`);
  }
}

export * from './status.js';
export * from './create.js';
export * from './secrets.js';

