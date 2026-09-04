import { describe, it, expect } from 'vitest';
import { AuthResolver, maskToken } from '../../HELIX/src/auth/index.js';
import { BotDatabase } from '../../HELIX/src/db/index.js';

describe('AuthResolver', () => {
  it('masks tokens securely for display', () => {
    expect(maskToken('gho_1234567890abcdef')).toBe('gho_...cdef');
    expect(maskToken('short')).toBe('***');
  });

  it('is derived entirely from SQLite /helix-auth sessions, not env or client discovery', () => {
    const db = BotDatabase.getInstance();
    db.setUserSession({ userId: 'member-1', username: 'Member One', provider: 'opencode', token: 'oc-test-token' });
    db.setUserSession({ userId: 'member-1', username: 'Member One', provider: 'copilot', token: 'cp-test-token' });

    const statuses = AuthResolver.resolveAll();
    expect(statuses).toHaveLength(3);

    const providers = statuses.map(s => s.provider);
    expect(providers).toContain('copilot');
    expect(providers).toContain('antigravity');
    expect(providers).toContain('opencode');

    const opencode = statuses.find(s => s.provider === 'opencode')!;
    const copilot = statuses.find(s => s.provider === 'copilot')!;
    const antigravity = statuses.find(s => s.provider === 'antigravity')!;

    expect(opencode.authenticated).toBe(true);
    expect(copilot.authenticated).toBe(true);
    expect(antigravity.authenticated).toBe(false);
    expect(opencode.source).toBe('sqlite user_sessions');

    for (const status of statuses) {
      expect(typeof status.authenticated).toBe('boolean');
      expect(typeof status.source).toBe('string');
      expect(typeof status.detail).toBe('string');
    }
  });
});
