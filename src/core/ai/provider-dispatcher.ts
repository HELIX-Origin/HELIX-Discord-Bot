import pc from 'picocolors';
import { AuthResolver, ProviderAuthStatus } from '../auth/index.js';
import { SynthesizedPrompt } from './prompt-synthesizer.js';
import { logger } from '../../utils/logger/index.js';

export class ProviderDispatcher {
  /**
   * Determine best available AI provider
   */
  public static selectBestProvider(preferred?: string): ProviderAuthStatus | null {
    const all = AuthResolver.resolveAll();

    if (preferred) {
      const match = all.find(p => p.provider === preferred.toLowerCase() && p.authenticated);
      if (match) return match;
    }

    // Default priority: Antigravity -> Copilot -> Open Code
    const order = ['antigravity', 'copilot', 'opencode'];
    for (const id of order) {
      const p = all.find(x => x.provider === id && x.authenticated);
      if (p) return p;
    }

    return all.find(x => x.authenticated) || null;
  }

  /**
   * Dispatch query to AI agent
   */
  public static async dispatch(
    prompt: SynthesizedPrompt,
    provider: ProviderAuthStatus | null
  ): Promise<void> {
    logger.title(`HELIX AI Assistant`);
    console.log(`  ${pc.dim(prompt.contextSummary)}`);

    if (!provider) {
      logger.warn('No authenticated AI provider detected.');
      logger.info('Please log in with GitHub CLI ("gh auth login"), Antigravity, or configure .env');
      console.log('\nSynthesized Prompt Payload:');
      console.log(pc.dim(prompt.userPrompt));
      return;
    }

    logger.success(`Routing to primary agent: ${provider.displayName} (${provider.source})`);
    console.log();

    // Render structured response for developer
    console.log(pc.bold(pc.cyan('─'.repeat(60))));
    console.log(pc.bold('HELIX Context Query:'));
    console.log(pc.dim(prompt.userPrompt.trim()));
    console.log(pc.bold(pc.cyan('─'.repeat(60))));
    console.log(pc.green('✔ Query ready for agent execution.'));
    console.log(pc.dim(`Connected agent: ${provider.displayName}`));
    console.log();
  }
}
