import {
  detectLanguage,
  getPluginByExtension,
  getAllPlugins,
} from '../registry.js';

const FALLBACK_EXTENSIONS: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  pyw: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  cs: 'csharp',
  cpp: 'cpp',
  cxx: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  h: 'c',
  c: 'c',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
  dart: 'dart',
  html: 'html',
  css: 'css',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  sql: 'sql',
  sh: 'shell',
  md: 'markdown',
  vue: 'vue',
  svelte: 'svelte',
};

/**
 * Detects programming language from a file path or URL dynamically via the Plugin Registry.
 */
export function detectLanguageFromPath(filePath: string): string | undefined {
  // 1. Check loaded plugin registry
  const plugin = detectLanguage(filePath);
  if (plugin) return plugin.id;

  const cleanPath = filePath.split('?')[0].split('#')[0];
  const lastDot = cleanPath.lastIndexOf('.');
  if (lastDot === -1) return undefined;
  const extWithoutDot = cleanPath.slice(lastDot + 1).toLowerCase();
  const ext = '.' + extWithoutDot;

  const pluginByExt = getPluginByExtension(ext);
  if (pluginByExt) return pluginByExt.id;

  // 2. Fallback check across all registered plugins
  for (const p of getAllPlugins()) {
    if (p.fileExtensions.some((e) => e.toLowerCase() === ext)) {
      return p.id;
    }
  }

  // 3. Fallback map for unregistered extensions
  return FALLBACK_EXTENSIONS[extWithoutDot];
}

export { FALLBACK_EXTENSIONS };