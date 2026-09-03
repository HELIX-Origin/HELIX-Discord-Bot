import pc from 'picocolors';
import { execSync } from 'child_process';
import { logger } from '../../utils/logger/index.js';

export function compareVersions(current: string, latest: string): number {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const [cMaj, cMin, cPatch] = parse(current);
  const [lMaj, lMin, lPatch] = parse(latest);

  if (lMaj > cMaj) return 1;
  if (lMaj < cMaj) return -1;
  if (lMin > cMin) return 1;
  if (lMin < cMin) return -1;
  if (lPatch > cPatch) return 1;
  if (lPatch < cPatch) return -1;
  return 0;
}

export async function updateCommand(): Promise<void> {
  const currentVersion = '0.1.0';
  logger.title('HELIX CLI Version Check');
  console.log(`  Current installed version: ${pc.bold(currentVersion)}`);

  try {
    const latestVersion = execSync('npm view helix-cli version', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();

    if (latestVersion) {
      console.log(`  Latest registry version:   ${pc.bold(latestVersion)}`);

      if (compareVersions(currentVersion, latestVersion) > 0) {
        logger.warn(`A newer version of HELIX CLI is available: v${latestVersion}`);
        console.log(`\nTo upgrade globally, run:`);
        console.log(pc.cyan(`  npm install -g helix-cli@latest\n`));
      } else {
        logger.success('You are on the latest version of HELIX CLI!');
      }
    } else {
      logger.info('Registry check returned no version (package may not yet be published to public npm).');
    }
  } catch {
    logger.info('Could not reach npm registry to check for updates (offline or unpublished).');
  }
}

export default updateCommand;
