/**
 * src/plugins/sdk/source-providers/index.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Built-in source providers (GitHub, GitLab, Bitbucket, Pastebin) and registrar.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { registerSourceProvider } from '../../registry.js';
import { githubSourceProvider } from './github.js';
import { gitlabSourceProvider } from './gitlab.js';
import { bitbucketSourceProvider } from './bitbucket.js';
import { pastebinSourceProvider } from './pastebin.js';

export * from './github.js';
export * from './gitlab.js';
export * from './bitbucket.js';
export * from './pastebin.js';

export const builtInSourceProviders = [
  githubSourceProvider,
  gitlabSourceProvider,
  bitbucketSourceProvider,
  pastebinSourceProvider,
];

/**
 * Registers default built-in source providers in the plugin registry.
 */
export function registerBuiltInSourceProviders(): void {
  for (const provider of builtInSourceProviders) {
    registerSourceProvider(provider);
  }
}
