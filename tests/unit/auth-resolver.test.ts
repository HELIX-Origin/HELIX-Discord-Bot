import { describe, it, expect } from 'vitest';
import { AuthResolver, maskToken } from '../../src/core/auth/index.js';

describe('AuthResolver', () => {
  it('masks tokens securely for terminal display', () => {
    expect(maskToken('gho_1234567890abcdef')).toBe('gho_...cdef');
    expect(maskToken('short')).toBe('***');
  });

  it('resolves all three AI providers', () => {
    const statuses = AuthResolver.resolveAll();
    expect(statuses).toHaveLength(3);

    const providers = statuses.map(s => s.provider);
    expect(providers).toContain('copilot');
    expect(providers).toContain('antigravity');
    expect(providers).toContain('opencode');

    for (const status of statuses) {
      expect(typeof status.authenticated).toBe('boolean');
      expect(typeof status.source).toBe('string');
      expect(typeof status.detail).toBe('string');
    }
  });
});
