import { ContextDetector, PromptSynthesizer, ProviderDispatcher } from '../../core/ai/index.js';
import { logger } from '../../utils/logger/index.js';

export async function queryAi(queryString: string, options: { provider?: string } = {}): Promise<void> {
  if (!queryString || queryString.trim() === '') {
    logger.error('Please specify a query or instruction: helix ai query "<query>"');
    return;
  }

  const context = ContextDetector.detect(process.cwd());
  const prompt = PromptSynthesizer.build(queryString, context, process.cwd());
  const provider = ProviderDispatcher.selectBestProvider(options.provider);

  await ProviderDispatcher.dispatch(prompt, provider);
}

// Alias for convenience
export const askAi = queryAi;
