import { AuthResolver } from '../../core/auth/index.js';
import { logger } from '../../utils/logger/index.js';

export function testAiProvider(providerName: string): void {
  const norm = providerName.toLowerCase();
  let status;

  if (norm.includes('copilot') || norm.includes('github')) {
    status = AuthResolver.resolveCopilot();
  } else if (norm.includes('antigravity') || norm.includes('gemini')) {
    status = AuthResolver.resolveAntigravity();
  } else if (norm.includes('opencode')) {
    status = AuthResolver.resolveOpenCode();
  } else {
    logger.error(`Unknown AI provider: "${providerName}". Supported: copilot, antigravity, opencode.`);
    return;
  }

  logger.title(`Testing Provider: ${status.displayName}`);
  if (status.authenticated) {
    logger.success(`Connection ready via ${status.source}`);
    console.log(`Details: ${status.detail}`);
  } else {
    logger.warn(`Provider is not authenticated.`);
    console.log(`Details: ${status.detail}`);
  }
}
