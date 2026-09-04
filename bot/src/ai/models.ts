export interface AIModelInfo {
  id: string;
  name: string;
  provider: 'opencode' | 'antigravity' | 'copilot';
  isFree: boolean;
  description: string;
}

export const FREE_DEFAULT_MODEL: AIModelInfo = {
  id: 'big-pickle',
  name: "OpenCode Zen's BigPickle",
  provider: 'opencode',
  isFree: true,
  description: 'Free community development model provided by OpenCode Zen',
};

export const AVAILABLE_MODELS: Record<string, AIModelInfo[]> = {
  opencode: [
    FREE_DEFAULT_MODEL,
    {
      id: 'opencode-zen-standard',
      name: 'OpenCode Zen Standard',
      provider: 'opencode',
      isFree: true,
      description: 'Standard open development and syntax model',
    },
    {
      id: 'opencode-pro',
      name: 'OpenCode Pro 2.0',
      provider: 'opencode',
      isFree: false,
      description: 'High-capability code synthesis and refactoring model (Key Required)',
    },
  ],
  antigravity: [
    {
      id: 'gemini-2.5-flash',
      name: 'Google Gemini 2.5 Flash',
      provider: 'antigravity',
      isFree: true,
      description: 'Ultra-fast multimodal code and reasoning model (Free Tier)',
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Google Gemini 1.5 Flash',
      provider: 'antigravity',
      isFree: true,
      description: 'High frequency completions and rapid diagnostics (Free Tier)',
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Google Gemini 2.5 Pro',
      provider: 'antigravity',
      isFree: false,
      description: 'Google Deepmind flagship complex problem solver (Key Required)',
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Google Gemini 1.5 Pro',
      provider: 'antigravity',
      isFree: false,
      description: '2-million token context window for large repository analysis (Key Required)',
    },
  ],
  copilot: [
    {
      id: 'gpt-4o-mini',
      name: 'GitHub Copilot GPT-4o Mini',
      provider: 'copilot',
      isFree: true,
      description: 'Affordable, fast coding model for quick functions (Free Tier)',
    },
    {
      id: 'gpt-4o',
      name: 'GitHub Copilot GPT-4o',
      provider: 'copilot',
      isFree: false,
      description: 'OpenAI flagship multimodal code generation model (Key Required)',
    },
    {
      id: 'claude-3.5-sonnet',
      name: 'GitHub Copilot Claude 3.5 Sonnet',
      provider: 'copilot',
      isFree: false,
      description: 'Anthropic state-of-the-art coding and architecture model (Key Required)',
    },
    {
      id: 'o1-mini',
      name: 'GitHub Copilot OpenAI o1-mini',
      provider: 'copilot',
      isFree: false,
      description: 'Advanced reasoning model for algorithmic challenges (Key Required)',
    },
  ],
};

export function getAllModels(): AIModelInfo[] {
  return Object.values(AVAILABLE_MODELS).flat();
}

export function getFreeModels(): AIModelInfo[] {
  return getAllModels().filter(m => m.isFree);
}

export function getModelsForProvider(provider: string): AIModelInfo[] {
  return AVAILABLE_MODELS[provider.toLowerCase()] || [];
}

export function getFreeModelForProvider(provider: string): AIModelInfo {
  const freeModels = getModelsForProvider(provider).filter(m => m.isFree);
  if (freeModels.length > 0) return freeModels[0];
  return FREE_DEFAULT_MODEL;
}

export function getModelById(modelId: string): AIModelInfo | null {
  return getAllModels().find(m => m.id.toLowerCase() === modelId.toLowerCase()) || null;
}

export interface ModelResolutionResult {
  model: AIModelInfo;
  isFreeTier: boolean;
  downgraded: boolean;
  downgradeReason?: string;
}

export function resolveAIModel(
  requestedModelId?: string | null,
  userHasKey: boolean = false,
  provider?: string | null
): ModelResolutionResult {
  // If user does not have an API key, allow them to freely choose from any free model provided by Google, GitHub, or OpenCode!
  if (!userHasKey) {
    if (requestedModelId) {
      const requested = getModelById(requestedModelId);
      if (requested && requested.isFree) {
        return {
          model: requested,
          isFreeTier: true,
          downgraded: false,
        };
      }
      if (requested && !requested.isFree) {
        const fallback = getFreeModelForProvider(requested.provider);
        return {
          model: fallback,
          isFreeTier: true,
          downgraded: true,
          downgradeReason: `Model \`${requested.name}\` requires an API key. Reverted to free model \`${fallback.name}\`. Available free models: Gemini 2.5 Flash, Gemini 1.5 Flash, GPT-4o Mini, BigPickle, and OpenCode Zen Standard.`,
        };
      }
    }

    // No specific model requested, check if provider was specified
    if (provider) {
      const freeModel = getFreeModelForProvider(provider);
      return {
        model: freeModel,
        isFreeTier: true,
        downgraded: false,
      };
    }

    return {
      model: FREE_DEFAULT_MODEL,
      isFreeTier: true,
      downgraded: false,
    };
  }

  // User has an API key: resolve their model
  if (requestedModelId) {
    const requested = getModelById(requestedModelId);
    if (requested) {
      return {
        model: requested,
        isFreeTier: requested.isFree,
        downgraded: false,
      };
    }
  }

  // If no model specified or model not found, pick the primary model for their provider
  if (provider && AVAILABLE_MODELS[provider.toLowerCase()]) {
    const providerModels = AVAILABLE_MODELS[provider.toLowerCase()];
    return {
      model: providerModels[0],
      isFreeTier: providerModels[0].isFree,
      downgraded: false,
    };
  }

  return {
    model: FREE_DEFAULT_MODEL,
    isFreeTier: true,
    downgraded: false,
  };
}
