import { ContextDetector, PromptSynthesizer, ProviderDispatcher } from '../../core/ai/index.js';
import { logger } from '../../utils/logger/index.js';

export async function generateFeatureWithAi(
  featureDescription: string,
  options: { provider?: string } = {}
): Promise<void> {
  if (!featureDescription || featureDescription.trim() === '') {
    logger.error('Please specify a feature to generate: helix ai generate "<feature description>"');
    return;
  }

  const context = ContextDetector.detect(process.cwd());
  const query = `Generate code and implementation for this feature: "${featureDescription}". Provide production-ready, strictly typed code adhering to standard architecture.`;

  const prompt = PromptSynthesizer.build(query, context, process.cwd());
  const provider = ProviderDispatcher.selectBestProvider(options.provider);

  await ProviderDispatcher.dispatch(prompt, provider);
}
