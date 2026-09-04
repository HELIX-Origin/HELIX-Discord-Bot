/**
 * src/plugins/sdk/ast-parser.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Lightweight AST, Lexer, and Tokenizer for zero-AI code intelligence.
 * Provides fast, local structural inspection, balanced delimiter matching,
 * scope navigation, and declaration discovery across languages.
 * ──────────────────────────────────────────────────────────────────────────
 */

export interface Token {
  type: 'keyword' | 'identifier' | 'string' | 'number' | 'comment' | 'operator' | 'punctuation' | 'whitespace';
  value: string;
  line: number;
  column: number;
}

export interface Declaration {
  kind: 'function' | 'class' | 'interface' | 'variable' | 'type' | 'struct' | 'enum';
  name: string;
  line: number;
  export: boolean;
  async?: boolean;
}

export interface ScopeBlock {
  type: 'function' | 'class' | 'block' | 'loop' | 'conditional';
  startLine: number;
  endLine: number;
  parent?: ScopeBlock;
}

/**
 * Tokenizes source code into structured tokens.
 */
export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  const lines = code.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    let col = 0;

    while (col < lineText.length) {
      const char = lineText[col];

      // Whitespace
      if (/\s/.test(char)) {
        let val = '';
        while (col < lineText.length && /\s/.test(lineText[col])) {
          val += lineText[col++];
        }
        tokens.push({ type: 'whitespace', value: val, line: lineIdx + 1, column: col });
        continue;
      }

      // Single-line comment // or # or --
      if (
        (char === '/' && lineText[col + 1] === '/') ||
        char === '#' ||
        (char === '-' && lineText[col + 1] === '-')
      ) {
        tokens.push({
          type: 'comment',
          value: lineText.slice(col),
          line: lineIdx + 1,
          column: col + 1,
        });
        break;
      }

      // Strings (single, double, template backtick)
      if (char === '"' || char === "'" || char === '`') {
        const quote = char;
        let str = quote;
        const startCol = col + 1;
        col++;
        while (col < lineText.length) {
          if (lineText[col] === '\\') {
            str += lineText[col++] + (lineText[col++] || '');
            continue;
          }
          str += lineText[col];
          if (lineText[col] === quote) {
            col++;
            break;
          }
          col++;
        }
        tokens.push({ type: 'string', value: str, line: lineIdx + 1, column: startCol });
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        let num = '';
        const startCol = col + 1;
        while (col < lineText.length && /[\d._xXa-fA-F]/.test(lineText[col])) {
          num += lineText[col++];
        }
        tokens.push({ type: 'number', value: num, line: lineIdx + 1, column: startCol });
        continue;
      }

      // Identifiers & Keywords
      if (/[a-zA-Z_$]/.test(char)) {
        let id = '';
        const startCol = col + 1;
        while (col < lineText.length && /[a-zA-Z0-9_$]/.test(lineText[col])) {
          id += lineText[col++];
        }
        const isKeyword = /^(function|class|interface|type|struct|enum|const|let|var|def|fn|func|import|export|from|return|if|else|for|while|match|switch|case|try|catch|finally|async|await|pub|static|private|public|protected|val|package)$/.test(
          id
        );
        tokens.push({
          type: isKeyword ? 'keyword' : 'identifier',
          value: id,
          line: lineIdx + 1,
          column: startCol,
        });
        continue;
      }

      // Operators and punctuation
      const punc = char;
      col++;
      tokens.push({
        type: /[{}()[\],;:]/.test(punc) ? 'punctuation' : 'operator',
        value: punc,
        line: lineIdx + 1,
        column: col,
      });
    }
  }

  return tokens;
}

/**
 * Validates balanced brackets, parentheses, and braces.
 */
export function checkBalancedDelimiters(code: string): { balanced: boolean; error?: string; line?: number; column?: number } {
  const stack: { char: string; line: number; column: number }[] = [];
  const lines = code.split('\n');
  const matching: Record<string, string> = { ')': '(', '}': '{', ']': '[' };

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    let inString = false;
    let quoteChar = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];

      // Skip escaped characters
      if (char === '\\' && inString) {
        c++;
        continue;
      }

      // Handle strings
      if (char === '"' || char === "'" || char === '`') {
        if (!inString) {
          inString = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inString = false;
        }
        continue;
      }

      if (inString) continue;

      // Handle comments
      if (char === '/' && line[c + 1] === '/') break;
      if (char === '#') break;

      if (char === '(' || char === '{' || char === '[') {
        stack.push({ char, line: l + 1, column: c + 1 });
      } else if (char === ')' || char === '}' || char === ']') {
        const expected = matching[char];
        if (stack.length === 0) {
          return {
            balanced: false,
            error: `Unmatched closing delimiter '${char}'`,
            line: l + 1,
            column: c + 1,
          };
        }
        const top = stack.pop()!;
        if (top.char !== expected) {
          return {
            balanced: false,
            error: `Mismatched delimiter: expected '${top.char === '(' ? ')' : top.char === '{' ? '}' : ']'}' to match '${top.char}' at line ${top.line}, but found '${char}'`,
            line: l + 1,
            column: c + 1,
          };
        }
      }
    }
  }

  if (stack.length > 0) {
    const unclosed = stack.pop()!;
    return {
      balanced: false,
      error: `Unclosed delimiter '${unclosed.char}' opened at line ${unclosed.line}:${unclosed.column}`,
      line: unclosed.line,
      column: unclosed.column,
    };
  }

  return { balanced: true };
}

/**
 * Extracts top-level declarations (functions, classes, interfaces, variables).
 */
export function extractDeclarations(code: string): Declaration[] {
  const declarations: Declaration[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // TypeScript / JavaScript functions
    const fnMatch = line.match(/^(export\s+)?(async\s+)?function\s+([a-zA-Z0-9_$]+)/);
    if (fnMatch) {
      declarations.push({
        kind: 'function',
        name: fnMatch[3],
        line: lineNum,
        export: !!fnMatch[1],
        async: !!fnMatch[2],
      });
      continue;
    }

    // Python def
    const pyDefMatch = line.match(/^(async\s+)?def\s+([a-zA-Z0-9_]+)/);
    if (pyDefMatch) {
      declarations.push({
        kind: 'function',
        name: pyDefMatch[2],
        line: lineNum,
        export: !pyDefMatch[2].startsWith('_'),
        async: !!pyDefMatch[1],
      });
      continue;
    }

    // Rust fn
    const rsFnMatch = line.match(/^(pub\s+)?(async\s+)?fn\s+([a-zA-Z0-9_]+)/);
    if (rsFnMatch) {
      declarations.push({
        kind: 'function',
        name: rsFnMatch[3],
        line: lineNum,
        export: !!rsFnMatch[1],
        async: !!rsFnMatch[2],
      });
      continue;
    }

    // Go func
    const goFuncMatch = line.match(/^func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)/);
    if (goFuncMatch) {
      declarations.push({
        kind: 'function',
        name: goFuncMatch[1],
        line: lineNum,
        export: /^[A-Z]/.test(goFuncMatch[1]),
      });
      continue;
    }

    // Classes
    const classMatch = line.match(/^(export\s+)?(public\s+|abstract\s+)?class\s+([a-zA-Z0-9_$]+)/);
    if (classMatch) {
      declarations.push({
        kind: 'class',
        name: classMatch[3],
        line: lineNum,
        export: !!classMatch[1] || /public/.test(classMatch[2] || ''),
      });
      continue;
    }

    // TypeScript Interfaces
    const ifaceMatch = line.match(/^(export\s+)?interface\s+([a-zA-Z0-9_$]+)/);
    if (ifaceMatch) {
      declarations.push({
        kind: 'interface',
        name: ifaceMatch[2],
        line: lineNum,
        export: !!ifaceMatch[1],
      });
      continue;
    }

    // Rust Struct / Enum
    const structMatch = line.match(/^(pub\s+)?(struct|enum)\s+([a-zA-Z0-9_]+)/);
    if (structMatch) {
      declarations.push({
        kind: structMatch[2] as 'struct' | 'enum',
        name: structMatch[3],
        line: lineNum,
        export: !!structMatch[1],
      });
      continue;
    }
  }

  return declarations;
}
