import { describe, it, expect } from 'vitest';
import { RepoManager } from '../../src/core/hosting/index.js';

describe('RepoManager', () => {
  it('detects git installation status', () => {
    const isGit = RepoManager.isGitInstalled();
    expect(typeof isGit).toBe('boolean');
  });

  it('checks all code hosting platforms', () => {
    const statuses = RepoManager.checkAll();
    expect(statuses.length).toBeGreaterThanOrEqual(3);

    const platforms = statuses.map(s => s.platform);
    expect(platforms).toContain('github');
    expect(platforms).toContain('gitlab');
    expect(platforms).toContain('bitbucket');

    for (const s of statuses) {
      expect(typeof s.cliInstalled).toBe('boolean');
      expect(typeof s.authenticated).toBe('boolean');
      expect(typeof s.authDetail).toBe('string');
    }
  });

  it('handles syncSecrets safely without throwing errors', () => {
    const result = RepoManager.syncSecrets({
      envPath: 'non-existent-env-file-1234.env',
    });
    expect(result).toBeDefined();
    expect(result.syncedCount).toBe(0);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
