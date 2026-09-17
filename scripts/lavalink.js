#!/usr/bin/env node
/**
 * scripts/lavalink.js
 *
 * Automates downloading and running the official Lavalink v4 server alongside HELIX.
 *
 * Usage:
 *   node scripts/lavalink.js download   # Auto-downloads Lavalink.jar if missing
 *   node scripts/lavalink.js start      # Ensures jar exists and runs Lavalink v4
 */

import { existsSync, createWriteStream, renameSync, unlinkSync, mkdirSync, statSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const LAVALINK_DIR = resolve(REPO_ROOT, 'lavalink');
const JAR_PATH = resolve(LAVALINK_DIR, 'Lavalink.jar');
const TEMP_JAR_PATH = resolve(LAVALINK_DIR, 'Lavalink.jar.tmp');

const FALLBACK_DOWNLOAD_URL =
  'https://github.com/lavalink-devs/Lavalink/releases/download/4.2.2/Lavalink.jar';

/**
 * Resolves the download URL for the latest Lavalink v4 release via GitHub API.
 * @returns {Promise<string>}
 */
async function getLatestDownloadUrl() {
  try {
    const res = await fetch('https://api.github.com/repos/lavalink-devs/Lavalink/releases/latest', {
      headers: {
        'User-Agent': 'HELIX-Discord-Bot-Lavalink-Downloader',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      console.warn(`[Lavalink] GitHub API returned HTTP ${res.status}; using stable fallback release URL.`);
      return FALLBACK_DOWNLOAD_URL;
    }

    const data = await res.json();
    const asset = data.assets?.find((a) => a.name === 'Lavalink.jar');

    if (asset?.browser_download_url) {
      return asset.browser_download_url;
    }
  } catch (err) {
    console.warn(`[Lavalink] Could not fetch latest release info (${err.message}); using fallback.`);
  }

  return FALLBACK_DOWNLOAD_URL;
}

/**
 * Ensures Lavalink.jar is present in the lavalink directory, downloading it if missing.
 * @returns {Promise<string>}
 */
export async function ensureLavalinkJar() {
  if (!existsSync(LAVALINK_DIR)) {
    mkdirSync(LAVALINK_DIR, { recursive: true });
  }

  if (existsSync(JAR_PATH)) {
    const stats = statSync(JAR_PATH);
    if (stats.size > 1024 * 1024) {
      console.log(`[Lavalink] Found existing Lavalink.jar (${(stats.size / 1024 / 1024).toFixed(1)} MB).`);
      return JAR_PATH;
    }
    console.warn('[Lavalink] Existing Lavalink.jar appears corrupted or empty. Re-downloading...');
    try {
      unlinkSync(JAR_PATH);
    } catch {
      /* ignore */
    }
  }

  console.log('[Lavalink] Lavalink.jar not found. Checking for latest release...');
  const downloadUrl = await getLatestDownloadUrl();
  console.log(`[Lavalink] Downloading Lavalink.jar from: ${downloadUrl}`);

  const response = await fetch(downloadUrl, {
    redirect: 'follow',
    headers: { 'User-Agent': 'HELIX-Discord-Bot-Lavalink-Downloader' },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download Lavalink.jar (HTTP ${response.status}: ${response.statusText})`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  let downloadedBytes = 0;

  if (existsSync(TEMP_JAR_PATH)) {
    try {
      unlinkSync(TEMP_JAR_PATH);
    } catch {
      /* ignore */
    }
  }

  const fileStream = createWriteStream(TEMP_JAR_PATH);
  const webStream = response.body;
  const nodeReadable = Readable.fromWeb(webStream);

  let lastLog = 0;
  nodeReadable.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    const now = Date.now();
    if (now - lastLog > 1000 || (contentLength > 0 && downloadedBytes === contentLength)) {
      lastLog = now;
      if (contentLength > 0) {
        const percent = ((downloadedBytes / contentLength) * 100).toFixed(1);
        process.stdout.write(
          `\r[Lavalink] Download progress: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB / ${(contentLength / 1024 / 1024).toFixed(1)} MB)`,
        );
      } else {
        process.stdout.write(`\r[Lavalink] Downloaded: ${(downloadedBytes / 1024 / 1024).toFixed(1)} MB`);
      }
    }
  });

  nodeReadable.pipe(fileStream);
  await finished(fileStream);
  process.stdout.write('\n');

  renameSync(TEMP_JAR_PATH, JAR_PATH);
  const finalStats = statSync(JAR_PATH);
  console.log(`[Lavalink] ✅ Successfully installed Lavalink.jar (${(finalStats.size / 1024 / 1024).toFixed(1)} MB).`);

  return JAR_PATH;
}

/**
 * Checks if Java runtime is available on the system.
 * @returns {boolean}
 */
function checkJavaAvailability() {
  try {
    const result = spawnSync('java', ['-version'], { stdio: 'pipe' });
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Starts the Lavalink server.
 */
export async function startLavalink() {
  await ensureLavalinkJar();

  if (!checkJavaAvailability()) {
    console.error('\n❌ Error: Java runtime not found in PATH.');
    console.error('   Lavalink v4 requires Java 17 or higher (Java 21 recommended).');
    console.error('   Ubuntu/Debian:  sudo apt update && sudo apt install -y openjdk-21-jre-headless');
    console.error('   Windows:        Download and install OpenJDK 21 from https://adoptium.net/');
    process.exit(1);
  }

  const appYml = resolve(LAVALINK_DIR, 'application.yml');
  const appYmlExample = resolve(LAVALINK_DIR, 'application.yml.example');
  const rootAppYml = resolve(REPO_ROOT, 'application.yml');
  const rootAppYmlExample = resolve(REPO_ROOT, 'application.yml.example');

  if (!existsSync(appYml)) {
    if (existsSync(rootAppYml)) {
      console.log('[Lavalink] Copying application.yml from project root into lavalink/application.yml...');
      copyFileSync(rootAppYml, appYml);
    } else if (existsSync(appYmlExample)) {
      console.log('[Lavalink] application.yml not found. Initializing from lavalink/application.yml.example...');
      copyFileSync(appYmlExample, appYml);
    } else if (existsSync(rootAppYmlExample)) {
      console.log('[Lavalink] application.yml not found. Initializing from application.yml.example...');
      copyFileSync(rootAppYmlExample, appYml);
    } else {
      console.warn(`[Lavalink] ⚠️  Warning: application.yml not found. Lavalink will start with built-in defaults.`);
    }
  }

  console.log(`[Lavalink] Starting Lavalink v4 from ${LAVALINK_DIR}...`);

  const child = spawn('java', ['-jar', 'Lavalink.jar'], {
    cwd: LAVALINK_DIR,
    stdio: 'inherit',
    env: { ...process.env },
  });

  const forwardSignal = (sig) => {
    console.log(`[Lavalink] Stopping Lavalink server (${sig})...`);
    child.kill(sig);
  };

  process.on('SIGINT', forwardSignal);
  process.on('SIGTERM', forwardSignal);

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[Lavalink] Process terminated by signal ${signal}.`);
    } else {
      console.log(`[Lavalink] Process exited with code ${code ?? 0}.`);
    }
    process.exit(code ?? 0);
  });
}

// CLI entry point
const action = process.argv[2] || 'start';

if (action === 'download' || action === 'setup') {
  ensureLavalinkJar()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`\n❌ Failed to download Lavalink: ${err.message}`);
      process.exit(1);
    });
} else if (action === 'start') {
  startLavalink().catch((err) => {
    console.error(`\n❌ Failed to start Lavalink: ${err.message}`);
    process.exit(1);
  });
} else {
  console.log('Usage: node scripts/lavalink.js [download|start]');
  process.exit(1);
}
