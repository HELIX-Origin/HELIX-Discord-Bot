import pc from 'picocolors';
import { AuthResolver } from '../../core/auth/index.js';
import { logger } from '../../utils/logger/index.js';

export function showAiStatus(): void {
  logger.title('AI Agent Integration Status');
  logger.dim('Precedence: Installed Client CLI/Files -> .env fallback -> None\n');

  const statuses = AuthResolver.resolveAll();

  for (const s of statuses) {
    const icon = s.authenticated ? pc.green('✔') : pc.red('✖');
    const authLabel = s.authenticated
      ? pc.green(pc.bold('AUTHENTICATED'))
      : pc.red(pc.bold('UNAUTHENTICATED'));
    const sourceLabel = s.authenticated ? pc.cyan(`[Source: ${s.source}]`) : '';

    console.log(`  ${icon} ${pc.bold(s.displayName.padEnd(24))} ${authLabel} ${sourceLabel}`);
    console.log(`    ${pc.dim(s.detail)}`);
    if (s.tokenPreview) {
      console.log(`    ${pc.dim(`Token: ${s.tokenPreview}`)}`);
    }
    console.log();
  }

  const anyMissing = statuses.some(s => !s.authenticated);
  if (anyMissing) {
    logger.info('To enable missing AI providers, log in with their official CLI or configure .env keys.');
  }
}
