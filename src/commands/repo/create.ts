import path from 'path';
import { RepoManager } from '../../core/hosting/index.js';
import { logger } from '../../utils/logger/index.js';

export function createRepoRemote(options: {
  platform?: string;
  name?: string;
  visibility?: string;
}): void {
  const platform = (options.platform || 'github').toLowerCase() as 'github' | 'gitlab' | 'bitbucket';
  const repoName = options.name || path.basename(process.cwd());
  const visibility = (options.visibility || 'public') as 'public' | 'private';

  logger.title(`Creating Remote Repository on ${platform.toUpperCase()}`);
  const result = RepoManager.createRemoteRepo({
    platform,
    repoName,
    visibility,
    cwd: process.cwd(),
  });

  if (result.success) {
    logger.success(result.message);
  } else {
    logger.error(result.message);
  }
}
