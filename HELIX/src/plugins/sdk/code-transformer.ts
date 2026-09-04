/**
 * src/plugins/sdk/code-transformer.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Code refactoring and transformation engine (zero AI).
 * Applies rule-based code modernizations, syntax upgrades, and produces
 * concise before/after diffs.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { RefactorOutput } from '../types.js';

export interface TransformRule {
  id: string;
  name: string;
  apply: (code: string) => { transformed: string; applied: boolean; description: string };
}

/**
 * Built-in refactoring transformation rules.
 */
export const TRANSFORM_RULES: TransformRule[] = [
  {
    id: 'modernize-var',
    name: 'Convert `var` to `let` / `const`',
    apply: (code: string) => {
      let count = 0;
      const transformed = code.replace(/\bvar\s+([a-zA-Z0-9_$]+)\s*=/g, (_match, varName) => {
        count++;
        return `const ${varName} =`;
      });
      return {
        transformed,
        applied: count > 0,
        description: `Modernized ${count} legacy \`var\` declaration(s) to \`const\`.`,
      };
    },
  },
  {
    id: 'remove-debugger',
    name: 'Remove `debugger` statements',
    apply: (code: string) => {
      let count = 0;
      const transformed = code.replace(/^\s*debugger;\s*$/gm, () => {
        count++;
        return '';
      });
      return {
        transformed,
        applied: count > 0,
        description: `Removed ${count} \`debugger\` statement(s).`,
      };
    },
  },
  {
    id: 'prefer-template-literals',
    name: 'Convert string concatenation to template literals',
    apply: (code: string) => {
      let count = 0;
      const transformed = code.replace(/["']([^"']+)["']\s*\+\s*([a-zA-Z0-9_$]+)\s*\+\s*["']([^"']+)["']/g, (_m, s1, v, s2) => {
        count++;
        return `\`${s1}\${${v}}${s2}\``;
      });
      return {
        transformed,
        applied: count > 0,
        description: `Converted ${count} string concatenation(s) to template literals.`,
      };
    },
  },
  {
    id: 'prefer-optional-chaining',
    name: 'Simplify guard checks with optional chaining',
    apply: (code: string) => {
      let count = 0;
      const transformed = code.replace(/([a-zA-Z0-9_$]+)\s*&&\s*\1\.([a-zA-Z0-9_$]+)/g, (_m, obj, prop) => {
        count++;
        return `${obj}?.${prop}`;
      });
      return {
        transformed,
        applied: count > 0,
        description: `Simplified ${count} guard check(s) with optional chaining \`?.\`.`,
      };
    },
  },
  {
    id: 'convert-promise-then',
    name: 'Modernize Promise .then() chaining hints',
    apply: (code: string) => {
      let count = 0;
      const transformed = code.replace(/\.then\(\s*([a-zA-Z0-9_$]+)\s*=>\s*\{/g, (_m, param) => {
        count++;
        return `.then((${param}) => {`;
      });
      return {
        transformed,
        applied: count > 0,
        description: `Standardized ${count} promise callback parameter(s).`,
      };
    },
  },
];

/**
 * Refactors code by executing all matching modernization rules.
 */
export function refactorCode(code: string, language = 'typescript', ruleId?: string): RefactorOutput {
  let current = code;
  const transformations: string[] = [];

  const rulesToApply = ruleId
    ? TRANSFORM_RULES.filter((r) => r.id === ruleId)
    : TRANSFORM_RULES;

  for (const rule of rulesToApply) {
    const result = rule.apply(current);
    if (result.applied) {
      current = result.transformed;
      transformations.push(result.description);
    }
  }

  // Generate diff summary
  const originalLines = code.split('\n');
  const refactoredLines = current.split('\n');
  let diffSummary = `${transformations.length} transformation(s) applied.`;

  if (transformations.length === 0) {
    diffSummary = 'Code is already modern and adheres to standard idioms.';
  } else {
    diffSummary = `Modified ${Math.abs(refactoredLines.length - originalLines.length)} line(s). ${diffSummary}`;
  }

  return {
    language,
    originalCode: code,
    refactoredCode: current,
    transformations: transformations.length > 0 ? transformations : ['No refactoring needed.'],
    diffSummary,
  };
}
