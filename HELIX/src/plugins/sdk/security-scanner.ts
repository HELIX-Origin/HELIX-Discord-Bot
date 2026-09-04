/**
 * src/plugins/sdk/security-scanner.ts
 * ──────────────────────────────────────────────────────────────────────────
 * 100% Local, offline static security and anti-pattern auditor (zero AI, zero API keys).
 * Scans source code for SQL injection, hardcoded secrets, XSS vulnerabilities,
 * ReDoS hazards, and insecure cryptographic primitives.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { SecurityAuditResult, SecurityFinding } from '../types.js';

interface SecurityRule {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cwe?: string;
  pattern: RegExp;
  description: string;
  recommendation: string;
}

const SECURITY_RULES: SecurityRule[] = [
  {
    id: 'SEC-001',
    title: 'SQL Injection via String Concatenation',
    severity: 'critical',
    cwe: 'CWE-89',
    pattern: /(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+.*(\+\s*[a-zA-Z0-9_$]+|`.*?\$\{.*?\}|f".*?\{.*?\}.*?")/i,
    description: 'Dynamic query construction with concatenated variables detected. Raw inputs can alter SQL logic.',
    recommendation: 'Use parameterized queries, prepared statements, or ORM bound parameters.',
  },
  {
    id: 'SEC-002',
    title: 'Hardcoded Secret or API Key',
    severity: 'critical',
    cwe: 'CWE-798',
    pattern: /(api[_-]?key|secret|token|password|auth_token)\s*[:=]\s*["'](?!(process\.env|os\.environ|env!|config|default|true|false))([a-zA-Z0-9_\-./+=]{16,})["']/i,
    description: 'High-entropy credential or API token found hardcoded in source code.',
    recommendation: 'Store credentials in environment variables (`.env`) or a secrets manager.',
  },
  {
    id: 'SEC-003',
    title: 'Unescaped DOM Insertion (XSS Risk)',
    severity: 'high',
    cwe: 'CWE-79',
    pattern: /(\.innerHTML\s*=|dangerouslySetInnerHTML\s*=|document\.write\()/i,
    description: 'Direct insertion of HTML into the DOM without sanitization can lead to Cross-Site Scripting (XSS).',
    recommendation: 'Use `textContent`, DOM elements creation (`createElement`), or a sanitizer library (DOMPurify).',
  },
  {
    id: 'SEC-004',
    title: 'Weak Cryptographic Algorithm',
    severity: 'medium',
    cwe: 'CWE-327',
    pattern: /createHash\(["'](md5|sha1)["']\)|hashlib\.(md5|sha1)\(/i,
    description: 'MD5 and SHA-1 are cryptographically broken and vulnerable to collision attacks.',
    recommendation: 'Upgrade to SHA-256 (`sha256`) for digests or Argon2 / bcrypt for password hashing.',
  },
  {
    id: 'SEC-005',
    title: 'Regular Expression Denial of Service (ReDoS)',
    severity: 'medium',
    cwe: 'CWE-1333',
    pattern: /\([a-zA-Z0-9_.*+-]+\+?\)\+/i,
    description: 'Nested quantifiers in regular expressions can cause catastrophic backtracking under malicious inputs.',
    recommendation: 'Simplify regular expression structure or use atomic grouping / linear-time regex engines.',
  },
];

/**
 * Inspects source code locally for security vulnerabilities and code smells.
 */
export function scanSecurity(code: string, language = 'typescript'): SecurityAuditResult {
  const findings: SecurityFinding[] = [];
  const lines = code.split('\n');

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineNum = idx + 1;

    for (const rule of SECURITY_RULES) {
      if (rule.pattern.test(line)) {
        findings.push({
          severity: rule.severity,
          ruleId: rule.id,
          title: rule.title,
          description: rule.description,
          line: lineNum,
          snippet: line.trim().slice(0, 80),
          recommendation: rule.recommendation,
          cwe: rule.cwe,
        });
      }
    }
  }

  const summary = {
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
  };

  // Calculate local security score (0 to 100)
  let score = 100;
  score -= summary.critical * 35;
  score -= summary.high * 20;
  score -= summary.medium * 10;
  score -= summary.low * 5;
  score = Math.max(0, Math.min(100, score));

  return {
    language,
    findings,
    score,
    summary,
  };
}
