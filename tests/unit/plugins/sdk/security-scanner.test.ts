import { describe, it, expect } from 'vitest';
import { scanSecurity } from '../../../../HELIX/src/plugins/sdk/security-scanner.js';
import {
  sqlInjectionSample,
  hardcodedSecretSample,
  xssSample,
  weakHashSample,
  redosSample,
} from '../../../fixtures/code-samples.js';

describe('security-scanner — offline vulnerability auditing', () => {
  it('flags SQL injection via string concatenation as critical', () => {
    const audit = scanSecurity(sqlInjectionSample);
    expect(audit.findings.some((f) => f.ruleId === 'SEC-001' && f.severity === 'critical')).toBe(true);
  });

  it('flags hardcoded secrets as critical', () => {
    const audit = scanSecurity(hardcodedSecretSample);
    expect(audit.findings.some((f) => f.ruleId === 'SEC-002')).toBe(true);
  });

  it('flags unsanitized DOM insertion as high', () => {
    const audit = scanSecurity(xssSample);
    expect(audit.findings.some((f) => f.ruleId === 'SEC-003' && f.severity === 'high')).toBe(true);
  });

  it('flags weak cryptographic algorithms as medium', () => {
    const audit = scanSecurity(weakHashSample);
    expect(audit.findings.some((f) => f.ruleId === 'SEC-004' && f.severity === 'medium')).toBe(true);
  });

  it('flags nested regex quantifiers as medium', () => {
    const audit = scanSecurity(redosSample);
    expect(audit.findings.some((f) => f.ruleId === 'SEC-005' && f.severity === 'medium')).toBe(true);
  });

  it('reports the correct line numbers and summary counts', () => {
    const code = ['const q = "SELECT * FROM t WHERE name = \' + user;'];
    const audit = scanSecurity(code.join('\n'));
    expect(audit.findings[0].line).toBe(1);
    expect(audit.summary.critical).toBe(1);
  });

  it('produces a perfect score for clean code', () => {
    const audit = scanSecurity('const x = foo && bar;');
    expect(audit.findings).toHaveLength(0);
    expect(audit.score).toBe(100);
  });

  it('penalizes score with the severity weight table', () => {
    const clean = scanSecurity('ok');
    const risky = scanSecurity(hardcodedSecretSample);
    expect(risky.score).toBeLessThan(clean.score);
  });
});