/**
 * src/plugins/sdk/source-resolver.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Multi-source code ingestion & resolver engine (zero AI).
 * Resolves source code from:
 * 1. Pasted code & Markdown code blocks (```lang ... ```)
 * 2. Discord file attachments (.ts, .py, .rs, .go, .java, logs, etc.)
 * 3. Remote repositories and gists (GitHub, GitLab, Bitbucket, Gist, Pastebin)
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { ResolvedSource, SourceResolveOptions, SourceOrigin } from '../types.js';
import {
  getPlugin,
  getPluginByExtension,
  getAllPlugins,
  findSourceProviderForUrl,
} from '../registry.js';
import { registerBuiltInSourceProviders } from './source-providers/index.js';
import { detectLanguageFromPath, FALLBACK_EXTENSIONS } from './detect-language.js';

export { detectLanguageFromPath } from './detect-language.js';

// Ensure built-in source providers are registered
registerBuiltInSourceProviders();

const MAX_FETCH_BYTES = 1024 * 1024; // 1 MB limit
const FETCH_TIMEOUT_MS = 8000; // 8 seconds

/**
 * Normalizes language name from alias or extension dynamically via the Plugin Registry.
 */
export function normalizeLanguage(lang?: string): string | undefined {
  if (!lang) return undefined;
  const clean = lang.trim().toLowerCase().replace(/^\./, '');

  // 1. Direct plugin lookup by ID
  const direct = getPlugin(clean);
  if (direct) return direct.id;

  // 2. Lookup by extension (e.g. "ts" -> ".ts")
  const byExt = getPluginByExtension(`.${clean}`);
  if (byExt) return byExt.id;

  // 3. Search loaded plugins by name or id
  for (const plugin of getAllPlugins()) {
    if (plugin.id.toLowerCase() === clean || plugin.name.toLowerCase() === clean) {
      return plugin.id;
    }
  }

  // 4. Fallback map for common aliases/extensions
  if (FALLBACK_EXTENSIONS[clean]) {
    return FALLBACK_EXTENSIONS[clean];
  }

  return clean;
}

/**
 * Heuristically infers language from code syntax patterns.
 */
export function inferLanguageFromSyntax(code: string): string {
  const trimmed = code.trim();

  // Rust patterns
  if (/\bfn\s+\w+\s*\(/.test(trimmed) && (/\blet\s+mut\b/.test(trimmed) || /\bimpl\b/.test(trimmed) || /\bpub\s+struct\b/.test(trimmed))) {
    return 'rust';
  }

  // Go patterns
  if (/\bpackage\s+\w+/.test(trimmed) || (/\bfunc\s+(?:\([^)]+\)\s+)?\w+\s*\(/.test(trimmed) && /\bimport\s+\(/.test(trimmed))) {
    return 'go';
  }

  // Python patterns
  if (/\bdef\s+\w+\s*\(/.test(trimmed) && (/:(\s*)$/m.test(trimmed) || /\belif\b/.test(trimmed) || /\bimport\s+[\w.]+\b/.test(trimmed))) {
    return 'python';
  }

  // Java patterns
  if (/\bpublic\s+(?:class|interface|enum)\b/.test(trimmed) || /\bpublic\s+static\s+void\s+main\b/.test(trimmed) || /\bSystem\.out\.println\b/.test(trimmed)) {
    return 'java';
  }

  // C# patterns
  if (/\busing\s+System;/.test(trimmed) || /\bnamespace\s+[\w.]+\b/.test(trimmed) || /\bConsole\.WriteLine\b/.test(trimmed)) {
    return 'csharp';
  }

  // TypeScript / JavaScript
  if (/\binterface\s+\w+/.test(trimmed) || /\btype\s+\w+\s*=/.test(trimmed) || /:\s*(?:string|number|boolean|any)\b/.test(trimmed)) {
    return 'typescript';
  }

  if (/\bconst\b|\blet\b|\bfunction\b|\bimport\b|\bexport\b/.test(trimmed)) {
    return 'javascript';
  }

  // JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // not valid JSON
    }
  }

  return 'text';
}

/**
 * Normalizes remote repository or gist URL to its raw content URL dynamically via registered SourceProviders.
 */
export function normalizeRemoteUrl(rawUrl: string): { url: string; origin: SourceOrigin; label: string; language?: string } | null {
  // 1. Check registered pluggable SourceProviders (GitHub, GitLab, Bitbucket, Gist, Pastebin, Enterprise repos)
  const providerResolution = findSourceProviderForUrl(rawUrl);
  if (providerResolution) {
    return {
      url: providerResolution.rawUrl,
      origin: providerResolution.origin,
      label: providerResolution.label,
      language: providerResolution.language,
    };
  }

  // 2. Generic HTTP / HTTPS raw text endpoint fallback
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return {
        url: rawUrl,
        origin: 'url',
        label: `URL: ${parsed.hostname}${parsed.pathname}`,
        language: detectLanguageFromPath(parsed.pathname),
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Fetches content from a validated remote URL with size and timeout guards.
 */
export async function fetchRemoteCode(targetUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HELIX-Bot/1.0 (Code-Intelligence-Engine; +https://github.com/HELIX-Origin/HELIX-Discord-Bot)',
        Accept: 'text/plain, text/x-code, application/json, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch code from remote source (HTTP ${response.status}: ${response.statusText})`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_FETCH_BYTES) {
      throw new Error(`Source file exceeds 1MB limit (${Math.round(parseInt(contentLength, 10) / 1024)} KB)`);
    }

    const text = await response.text();
    if (text.length > MAX_FETCH_BYTES) {
      throw new Error(`Source file exceeds 1MB limit (${Math.round(text.length / 1024)} KB)`);
    }

    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extracts Markdown code block contents and language tag.
 */
export function parseMarkdownCodeBlock(input: string): { code: string; language?: string } {
  const blockMatch = input.match(/^```(\w+)?\r?\n([\s\S]*?)```$/);
  if (blockMatch) {
    return {
      language: normalizeLanguage(blockMatch[1]),
      code: blockMatch[2].trim(),
    };
  }

  // Also check if codeblock is embedded inside larger message
  const embeddedMatch = input.match(/```(\w+)?\r?\n([\s\S]*?)```/);
  if (embeddedMatch) {
    return {
      language: normalizeLanguage(embeddedMatch[1]),
      code: embeddedMatch[2].trim(),
    };
  }

  // Inline backticks `code`
  const inlineMatch = input.match(/^`([^`]+)`$/);
  if (inlineMatch) {
    return {
      code: inlineMatch[1].trim(),
    };
  }

  return {
    code: input.trim(),
  };
}

/**
 * Universal source code resolver.
 * Handles pasted code, Markdown codeblocks, attachments, and remote repository / gist URLs.
 */
export async function resolveSourceCode(options: SourceResolveOptions): Promise<ResolvedSource> {
  const explicitLang = normalizeLanguage(options.language);

  // 1. Check for Discord message attachment or explicit attachment option
  let attachmentUrl = options.attachmentUrl;
  let attachmentName = options.attachmentName;

  if (!attachmentUrl && options.message?.attachments?.size > 0) {
    const att = options.message.attachments.first();
    if (att) {
      attachmentUrl = att.url;
      attachmentName = att.name;
    }
  }

  if (!attachmentUrl && options.interaction?.options?.getAttachment) {
    const att = options.interaction.options.getAttachment('file');
    if (att) {
      attachmentUrl = att.url;
      attachmentName = att.name;
    }
  }

  if (attachmentUrl) {
    const code = await fetchRemoteCode(attachmentUrl);
    const detectedLang = explicitLang || (attachmentName ? detectLanguageFromPath(attachmentName) : undefined) || inferLanguageFromSyntax(code);

    return {
      code,
      language: detectedLang,
      sourceName: attachmentName || 'Discord Attachment',
      origin: 'attachment',
      sizeBytes: Buffer.byteLength(code, 'utf8'),
      url: attachmentUrl,
    };
  }

  // 2. Check if input string is a URL (GitHub, GitLab, Bitbucket, Gist, Pastebin, Raw)
  const rawInput = (options.input || '').trim();
  if (/^https?:\/\//i.test(rawInput)) {
    const normalized = normalizeRemoteUrl(rawInput);
    if (normalized) {
      const code = await fetchRemoteCode(normalized.url);
      const detectedLang = explicitLang || normalized.language || inferLanguageFromSyntax(code);

      return {
        code,
        language: detectedLang,
        sourceName: normalized.label,
        origin: normalized.origin,
        sizeBytes: Buffer.byteLength(code, 'utf8'),
        url: rawInput,
      };
    }
  }

  // 3. Pasted code or Markdown codeblock
  const parsedBlock = parseMarkdownCodeBlock(rawInput);
  const detectedLang = explicitLang || parsedBlock.language || inferLanguageFromSyntax(parsedBlock.code);

  return {
    code: parsedBlock.code,
    language: detectedLang,
    sourceName: 'Pasted Code',
    origin: 'pasted',
    sizeBytes: Buffer.byteLength(parsedBlock.code, 'utf8'),
  };
}
