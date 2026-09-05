/**
 * src/plugins/sandbox.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Sandboxed runtime evaluation engine for database-stored plugins.
 *
 * Executes plugin entry source code in an isolated node:vm execution context
 * without allowing direct filesystem access or unmonitored side-effects.
 * ──────────────────────────────────────────────────────────────────────────
 */

import vm from 'node:vm';
import type { LanguagePlugin } from './types.js';
import type { PluginManifest } from './manifest.js';

/**
 * Execute a stored plugin entry source string in a secure sandbox and extract
 * the instantiated LanguagePlugin.
 */
export function executePluginSandbox(source: string, manifest: PluginManifest): LanguagePlugin {
  const moduleObj = { exports: {} as any };
  const exportsObj = moduleObj.exports;

  const sandbox: Record<string, any> = {
    console: {
      log: (...args: any[]) => console.log(`[Sandbox:${manifest.id}]`, ...args),
      warn: (...args: any[]) => console.warn(`[Sandbox:${manifest.id}]`, ...args),
      error: (...args: any[]) => console.error(`[Sandbox:${manifest.id}]`, ...args),
      info: (...args: any[]) => console.info(`[Sandbox:${manifest.id}]`, ...args),
    },
    module: moduleObj,
    exports: exportsObj,
    require: (specifier: string) => {
      throw new Error(`External require("${specifier}") is prohibited in plugin sandbox`);
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URL,
    Buffer,
    Map,
    Set,
    Promise,
    RegExp,
    Date,
    JSON,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
  };

  const context = vm.createContext(sandbox);

  let executable = source;
  // Transpile simple ES module export keywords to commonjs exports if present
  if (
    executable.includes('export default') ||
    executable.includes('export const') ||
    executable.includes('export let') ||
    executable.includes('export function')
  ) {
    executable = executable
      .replace(/export\s+default\s+/g, 'module.exports.default = ')
      .replace(/export\s+const\s+([a-zA-Z0-9_$]+)\s*=/g, 'const $1 = module.exports.$1 =')
      .replace(/export\s+let\s+([a-zA-Z0-9_$]+)\s*=/g, 'let $1 = module.exports.$1 =')
      .replace(/export\s+function\s+([a-zA-Z0-9_$]+)/g, 'module.exports.$1 = function $1');
  }

  const script = new vm.Script(executable, { filename: `plugins/${manifest.id}/${manifest.entry || 'index.js'}` });
  script.runInContext(context, { timeout: 5000 });

  const mod = moduleObj.exports;
  let instance: LanguagePlugin | null = null;

  if (mod.default && typeof mod.default === 'object' && typeof mod.default.id === 'string') {
    instance = mod.default as LanguagePlugin;
  } else if (mod[manifest.id] && typeof mod[manifest.id] === 'object' && typeof mod[manifest.id].id === 'string') {
    instance = mod[manifest.id] as LanguagePlugin;
  } else {
    for (const key of Object.keys(mod)) {
      const exp = mod[key];
      if (
        exp &&
        typeof exp === 'object' &&
        typeof exp.id === 'string' &&
        typeof exp.lint === 'function'
      ) {
        instance = exp as LanguagePlugin;
        break;
      }
    }
  }

  if (!instance && typeof mod === 'object' && typeof mod.id === 'string' && typeof mod.lint === 'function') {
    instance = mod as LanguagePlugin;
  }

  if (!instance) {
    throw new Error(`Plugin "${manifest.id}" did not export a valid LanguagePlugin instance`);
  }

  return instance;
}
