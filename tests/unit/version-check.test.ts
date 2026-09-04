import { describe, it, expect } from 'vitest';
import { compareVersions } from '../../HELIX/src/utils/version.js';

describe('Version Comparison', () => {
  it('identifies identical versions', () => {
    expect(compareVersions('0.1.0', '0.1.0')).toBe(0);
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0);
  });

  it('identifies newer major versions', () => {
    expect(compareVersions('0.1.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '0.9.0')).toBe(-1);
  });

  it('identifies newer minor and patch versions', () => {
    expect(compareVersions('0.1.0', '0.2.0')).toBe(1);
    expect(compareVersions('0.1.0', '0.1.1')).toBe(1);
    expect(compareVersions('0.2.1', '0.2.0')).toBe(-1);
  });
});
