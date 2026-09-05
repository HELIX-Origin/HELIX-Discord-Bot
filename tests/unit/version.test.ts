import { describe, it, expect } from 'vitest';
import { compareVersions } from '../../HELIX/src/utils/version.js';

describe('src/utils/version.ts — compareVersions', () => {
  it('returns 0 for identical versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('returns 1 when latest exceeds current', () => {
    expect(compareVersions('1.2.3', '1.2.4')).toBe(1);
    expect(compareVersions('1.2.9', '1.3.0')).toBe(1);
    expect(compareVersions('9.0.0', '10.0.0')).toBe(1);
  });

  it('returns -1 when current exceeds latest', () => {
    expect(compareVersions('1.2.3', '1.2.2')).toBe(-1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(-1);
  });

  it('handles leading v prefixes and partial version strings', () => {
    expect(compareVersions('v1.0.0', '1.0.1')).toBe(1);
    expect(compareVersions('1', '1.0.0')).toBe(0);
    expect(compareVersions('2', '1.9.9')).toBe(-1);
  });

  it('compares patch-level differences', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBe(1);
    expect(compareVersions('1.0.1', '1.0.0')).toBe(-1);
  });
});