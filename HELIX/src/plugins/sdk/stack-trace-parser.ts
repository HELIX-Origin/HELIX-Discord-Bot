/**
 * src/plugins/sdk/stack-trace-parser.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Multi-runtime error triager and stack trace analyzer (zero AI).
 * Parses Node.js/V8, Python, Rust, Java, and Go errors, extracts failing
 * source locations, classifies root causes, and recommends deterministic fixes.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { DebugDiagnostic } from '../types.js';

/**
 * Universal error diagnostic parser.
 */
export function diagnoseError(errorLog: string, codeContext?: string): DebugDiagnostic {
  const cleanLog = errorLog.trim();

  // 1. Check for Rust compiler errors
  if (/error\[E\d+\]/.test(cleanLog) || cleanLog.includes('-->') || cleanLog.includes('cargo build')) {
    return parseRustError(cleanLog, codeContext);
  }

  // 2. Check for Python Traceback
  if (cleanLog.includes('Traceback (most recent call last):') || /File\s+"[^"]+",\s+line\s+\d+/.test(cleanLog)) {
    return parsePythonError(cleanLog, codeContext);
  }

  // 3. Check for Java / Spring Exception
  if (/Exception in thread|java\.lang\.\w+Exception|org\.springframework/.test(cleanLog)) {
    return parseJavaError(cleanLog, codeContext);
  }

  // 4. Check for Go runtime panics
  if (cleanLog.includes('panic: runtime error:') || cleanLog.includes('goroutine 1 [running]:')) {
    return parseGoPanic(cleanLog, codeContext);
  }

  // 5. Default to Node.js / V8 JavaScript / TypeScript error
  return parseV8Error(cleanLog, codeContext);
}

function parseV8Error(log: string, codeContext?: string): DebugDiagnostic {
  const firstLine = log.split('\n')[0] || '';
  const match = firstLine.match(/^(\w+Error|UnhandledPromiseRejection|Error):\s*(.*)$/);
  const errorType = match ? match[1] : 'JavaScript Error';
  const errorMessage = match ? match[2] : firstLine;

  const locMatch = log.match(/at\s+(?:.*?\s+\()?([^:()]+):(\d+):(\d+)\)?/);
  const file = locMatch ? locMatch[1].trim() : undefined;
  const line = locMatch ? parseInt(locMatch[2], 10) : undefined;
  const column = locMatch ? parseInt(locMatch[3], 10) : undefined;

  let rootCause = 'An unexpected runtime exception was thrown during execution.';
  let suggestedFix = 'Check object properties and ensure valid variable definitions before accessing.';
  let fixCode: { original: string; fixed: string } | undefined;
  let docLink = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error';

  if (errorMessage.includes('Cannot read properties of undefined') || errorMessage.includes('Cannot read property')) {
    const propMatch = errorMessage.match(/reading '([^']+)'/);
    const prop = propMatch ? propMatch[1] : 'property';
    rootCause = `Attempted to access property '${prop}' on an undefined or null variable.`;
    suggestedFix = `Use optional chaining (e.g. \`obj?.${prop}\`) or provide a fallback default (e.g. \`obj ?? {}\`).`;
    fixCode = {
      original: `const value = user.${prop};`,
      fixed: `const value = user?.${prop} ?? 'default';`,
    };
    docLink = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining';
  } else if (errorMessage.includes('is not a function')) {
    const fnMatch = errorMessage.match(/([a-zA-Z0-9_$]+) is not a function/);
    const fn = fnMatch ? fnMatch[1] : 'target';
    rootCause = `Variable '${fn}' is not callable as a function. It is either undefined or of incorrect type.`;
    suggestedFix = `Verify '${fn}' import/declaration and ensure it exports a valid function before invoking.`;
    fixCode = {
      original: `${fn}();`,
      fixed: `if (typeof ${fn} === 'function') { ${fn}(); }`,
    };
  } else if (errorType === 'ReferenceError') {
    const varMatch = errorMessage.match(/([a-zA-Z0-9_$]+) is not defined/);
    const varName = varMatch ? varMatch[1] : 'variable';
    rootCause = `Variable '${varName}' was referenced before being declared or is out of current lexical scope.`;
    suggestedFix = `Declare '${varName}' using \`const\` or \`let\` before referencing it.`;
    fixCode = {
      original: `console.log(${varName});`,
      fixed: `const ${varName} = 'initialized value';\nconsole.log(${varName});`,
    };
  }

  return {
    language: 'javascript',
    errorType,
    errorMessage,
    failingLocation: { file, line, column },
    rootCause,
    suggestedFix,
    fixCode,
    docLink,
  };
}

function parsePythonError(log: string, _codeContext?: string): DebugDiagnostic {
  const lines = log.split('\n').filter((l) => l.trim().length > 0);
  const lastLine = lines[lines.length - 1] || '';
  const match = lastLine.match(/^(\w+Error):\s*(.*)$/);
  const errorType = match ? match[1] : 'Python Exception';
  const errorMessage = match ? match[2] : lastLine;

  const locMatch = log.match(/File "([^"]+)", line (\d+)(?:, in (\w+))?/);
  const file = locMatch ? locMatch[1] : undefined;
  const line = locMatch ? parseInt(locMatch[2], 10) : undefined;

  let rootCause = 'A Python runtime exception was raised.';
  let suggestedFix = 'Add exception handling or validate data structures.';
  let fixCode: { original: string; fixed: string } | undefined;
  let docLink = 'https://docs.python.org/3/library/exceptions.html';

  if (errorType === 'AttributeError' && errorMessage.includes('NoneType')) {
    rootCause = 'Attempted to access an attribute or method on a variable that evaluates to `None`.';
    suggestedFix = 'Add a `None` check before accessing attributes or use `getattr(obj, "attr", default)`.';
    fixCode = {
      original: 'result = user.get_profile()',
      fixed: 'result = user.get_profile() if user is not None else None',
    };
  } else if (errorType === 'KeyError') {
    rootCause = `Dictionary key ${errorMessage} does not exist.`;
    suggestedFix = `Use \`dict.get(${errorMessage}, default)\` to safely retrieve optional dictionary keys without raising KeyError.`;
    fixCode = {
      original: `value = data[${errorMessage}]`,
      fixed: `value = data.get(${errorMessage}, None)`,
    };
  } else if (errorType === 'IndexError') {
    rootCause = 'Sequence index is out of bounds.';
    suggestedFix = 'Check `len(sequence)` before accessing indices or use slicing `sequence[:1]`.';
    fixCode = {
      original: 'first = items[0]',
      fixed: 'first = items[0] if len(items) > 0 else None',
    };
  }

  return {
    language: 'python',
    errorType,
    errorMessage,
    failingLocation: { file, line },
    rootCause,
    suggestedFix,
    fixCode,
    docLink,
  };
}

function parseRustError(log: string, _codeContext?: string): DebugDiagnostic {
  const codeMatch = log.match(/error\[(E\d+)\]:\s*(.*)/);
  const errorCode = codeMatch ? codeMatch[1] : 'RustCompilerError';
  const errorMessage = codeMatch ? codeMatch[2] : log.split('\n')[0];

  const locMatch = log.match(/-->\s+([^:]+):(\d+):(\d+)/);
  const file = locMatch ? locMatch[1] : undefined;
  const line = locMatch ? parseInt(locMatch[2], 10) : undefined;
  const column = locMatch ? parseInt(locMatch[3], 10) : undefined;

  let rootCause = 'Rust borrow checker or type system rejected compilation.';
  let suggestedFix = 'Check ownership, lifetimes, and mutable borrow rules.';
  let fixCode: { original: string; fixed: string } | undefined;
  let docLink = `https://doc.rust-lang.org/error_codes/${errorCode}.html`;

  if (errorCode === 'E0382') {
    rootCause = 'Use of moved value. The variable was transferred elsewhere and is no longer valid here.';
    suggestedFix = 'Clone the value with `.clone()` or pass by reference (`&val`) instead of taking ownership.';
    fixCode = {
      original: 'process_data(my_struct);\nprintln!("{:?}", my_struct);',
      fixed: 'process_data(&my_struct);\nprintln!("{:?}", my_struct);',
    };
  } else if (errorCode === 'E0502') {
    rootCause = 'Cannot borrow variable as mutable because it is also borrowed as immutable in the same scope.';
    suggestedFix = 'End the immutable borrow before creating a mutable borrow or restructure references.';
    fixCode = {
      original: 'let ref1 = &vec;\nvec.push(10);\nprintln!("{:?}", ref1);',
      fixed: '{\n    let ref1 = &vec;\n    println!("{:?}", ref1);\n}\nvec.push(10);',
    };
  }

  return {
    language: 'rust',
    errorType: `error[${errorCode}]`,
    errorMessage,
    failingLocation: { file, line, column },
    rootCause,
    suggestedFix,
    fixCode,
    docLink,
  };
}

function parseJavaError(log: string, _codeContext?: string): DebugDiagnostic {
  const match = log.match(/(\w+Exception):\s*(.*)/);
  const errorType = match ? match[1] : 'Java Exception';
  const errorMessage = match ? match[2] : log.split('\n')[0];

  const locMatch = log.match(/at\s+([a-zA-Z0-9_$.]+)\(([a-zA-Z0-9_]+\.java):(\d+)\)/);
  const file = locMatch ? locMatch[2] : undefined;
  const line = locMatch ? parseInt(locMatch[3], 10) : undefined;

  let rootCause = 'A Java runtime exception was thrown on the executing thread.';
  let suggestedFix = 'Check for null object references and add defensive validations.';
  let fixCode: { original: string; fixed: string } | undefined;

  if (errorType === 'NullPointerException') {
    rootCause = 'Attempted to invoke a method or access a field on a null object reference.';
    suggestedFix = 'Use `Optional.ofNullable(obj)` or add null checks `if (obj != null)`.';
    fixCode = {
      original: 'int length = str.length();',
      fixed: 'int length = (str != null) ? str.length() : 0;',
    };
  }

  return {
    language: 'java',
    errorType,
    errorMessage,
    failingLocation: { file, line },
    rootCause,
    suggestedFix,
    fixCode,
    docLink: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Exception.html',
  };
}

function parseGoPanic(log: string, _codeContext?: string): DebugDiagnostic {
  const panicMatch = log.match(/panic:\s*(.*)/);
  const errorMessage = panicMatch ? panicMatch[1] : log.split('\n')[0];

  const locMatch = log.match(/([a-zA-Z0-9_./-]+\.go):(\d+)/);
  const file = locMatch ? locMatch[1] : undefined;
  const line = locMatch ? parseInt(locMatch[2], 10) : undefined;

  return {
    language: 'go',
    errorType: 'Runtime Panic',
    errorMessage,
    failingLocation: { file, line },
    rootCause: 'Go runtime panicked due to an unhandled exception or memory bounds violation.',
    suggestedFix: 'Implement `recover()` inside deferred cleanup functions or validate slice bounds/pointer nil checks.',
    docLink: 'https://go.dev/doc/effective_go#panic',
  };
}
