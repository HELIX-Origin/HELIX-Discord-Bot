import { showAiStatus } from './status.js';
import { testAiProvider } from './test.js';
import { queryAi } from './query.js';
import { generateFeatureWithAi } from './generate.js';
import { logger } from '../../utils/logger/index.js';

export async function aiCommand(
  action: string = 'status',
  queryOrProvider?: string,
  options: { provider?: string } = {}
): Promise<void> {
  if (action === 'status') {
    showAiStatus();
  } else if (action === 'test') {
    if (!queryOrProvider) {
      logger.error('Please specify a provider to test: "helix ai test [copilot|antigravity|opencode]"');
      return;
    }
    testAiProvider(queryOrProvider);
  } else if (action === 'query' || action === 'ask') {
    await queryAi(queryOrProvider || '', options);
  } else if (action === 'generate') {
    await generateFeatureWithAi(queryOrProvider || '', options);
  } else {
    logger.error(`Unknown AI action: "${action}". Valid actions: status, test, query, generate`);
  }
}

export * from './status.js';
export * from './test.js';
export * from './query.js';
export * from './generate.js';
