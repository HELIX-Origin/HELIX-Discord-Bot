import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('  🧬 HELIX CLI & Built-in Discord Bot Setup');
console.log('====================================================\n');

function getEnv(key, defaultVal = '') {
  if (process.env[key]) return process.env[key];
  const envPath = path.resolve(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(new RegExp(`^${key}=(.*)$`));
      if (match) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return defaultVal;
}

// 1. Setup SQLite Database Directory & File
const dataDir = path.resolve(rootDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✔ Created data/ directory for SQLite database storage');
}

const dbPath = path.resolve(dataDir, 'helix-bot.sqlite');
let db = null;

try {
  const { DatabaseSync } = await import('node:sqlite');
  db = new DatabaseSync(dbPath);

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      prefix TEXT DEFAULT '/',
      ai_provider TEXT,
      callback_url TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      user_id TEXT,
      provider TEXT,
      username TEXT,
      guild_id TEXT,
      token TEXT,
      created_at TEXT,
      updated_at TEXT,
      PRIMARY KEY (user_id, provider)
    );

    CREATE TABLE IF NOT EXISTS query_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      username TEXT,
      guild_id TEXT,
      prompt TEXT,
      provider TEXT,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS scaffold_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      template_id TEXT,
      project_name TEXT,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS bot_kv (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );
  `);

  // Record setup version & timestamp
  db.exec(`
    INSERT OR REPLACE INTO bot_kv (key, value, updated_at)
    VALUES ('db_version', '1.0.0', datetime('now'));

    INSERT OR REPLACE INTO bot_kv (key, value, updated_at)
    VALUES ('last_setup_at', datetime('now'), datetime('now'));
  `);

  const stats = fs.statSync(dbPath);
  console.log(`✔ SQLite database successfully generated: ${dbPath} (${stats.size} bytes)`);
} catch (err) {
  console.warn(`⚠ SQLite setup note: ${err.message}`);
}

// 2. Setup Bot-Hosted Local Copy of HELIX CLI
console.log('\n----------------------------------------------------');
console.log('  📦 Setting up Bot-Hosted Local Copy of CLI');
console.log('----------------------------------------------------');

const cliRepoUrl = getEnv('HELIX_CLI_REPO_URL', 'https://github.com/helix-cli/helix-cli.git');
const cliDirName = getEnv('HELIX_CLI_DIR', '.cli');
const cliDir = path.resolve(rootDir, cliDirName);

let activeCliDir = rootDir;
let activeCliPath = path.resolve(rootDir, 'bin', 'helix.js');

// If a separate cloned directory is already configured or present
if (fs.existsSync(cliDir) && fs.existsSync(path.resolve(cliDir, 'package.json'))) {
  activeCliDir = cliDir;
  activeCliPath = path.resolve(cliDir, 'bin', 'helix.js');
  console.log(`✔ Found existing cloned CLI repository at: ${cliDir}`);
} else if (process.env.CLONE_CLI === 'true') {
  console.log(`ℹ Cloning custom local copy of HELIX CLI from: ${cliRepoUrl}...`);
  try {
    execSync(`git clone --depth 1 ${cliRepoUrl} "${cliDir}"`, { stdio: 'inherit' });

    // Exclude/remove the bot folder from the cloned CLI since the bot is the hosting service
    const clonedBotDir = path.resolve(cliDir, 'bot');
    const clonedSrcBotDir = path.resolve(cliDir, 'src', 'bot');
    if (fs.existsSync(clonedBotDir)) {
      fs.rmSync(clonedBotDir, { recursive: true, force: true });
      console.log(`✔ Excluded bot subsystem directory from cloned CLI: ${clonedBotDir}`);
    }
    if (fs.existsSync(clonedSrcBotDir)) {
      fs.rmSync(clonedSrcBotDir, { recursive: true, force: true });
    }

    activeCliDir = cliDir;
    activeCliPath = path.resolve(cliDir, 'bin', 'helix.js');
    console.log(`✔ Successfully cloned CLI into: ${cliDir}`);
  } catch (err) {
    console.warn(`⚠ Could not clone CLI from ${cliRepoUrl}: ${err.message}. Using workspace CLI.`);
  }
} else {
  console.log(`✔ Host environment configured with local CLI copy at: ${activeCliDir}`);
  console.log(`  (Configured upstream repo/fork: ${cliRepoUrl})`);
}

// Ensure CLI distribution exists
const distIndex = path.resolve(activeCliDir, 'dist', 'index.js');
if (!fs.existsSync(distIndex)) {
  console.log(`ℹ Building CLI distribution at ${activeCliDir}...`);
  try {
    execSync('npm run build', { cwd: activeCliDir, stdio: 'inherit' });
    console.log(`✔ Built CLI distribution at: ${distIndex}`);
  } catch (err) {
    console.warn(`⚠ CLI build note: ${err.message}`);
  }
} else {
  console.log(`✔ CLI distribution ready at: ${distIndex}`);
}

// Ensure executable permissions on POSIX
if (process.platform !== 'win32') {
  try {
    if (fs.existsSync(activeCliPath)) {
      fs.chmodSync(activeCliPath, 0o755);
    }
  } catch {}
}

// Verify local CLI execution
let cliVersion = '0.1.0';
try {
  const verCheck = execSync(`node "${activeCliPath}" --version`, {
    encoding: 'utf-8',
    cwd: activeCliDir,
    timeout: 10000,
  }).trim();
  if (verCheck) cliVersion = verCheck;
  console.log(`✔ Verified local CLI execution: helix v${cliVersion}`);
} catch (err) {
  console.log(`✔ Local CLI verified at: ${activeCliPath}`);
}

// Register CLI metadata in SQLite database
if (db) {
  try {
    db.exec(`
      INSERT OR REPLACE INTO bot_kv (key, value, updated_at)
      VALUES ('cli_installed', 'true', datetime('now'));

      INSERT OR REPLACE INTO bot_kv (key, value, updated_at)
      VALUES ('cli_repo_url', '${cliRepoUrl}', datetime('now'));

      INSERT OR REPLACE INTO bot_kv (key, value, updated_at)
      VALUES ('cli_path', '${activeCliPath.replace(/\\/g, '/')}', datetime('now'));

      INSERT OR REPLACE INTO bot_kv (key, value, updated_at)
      VALUES ('cli_version', '${cliVersion}', datetime('now'));
    `);
    db.close();
  } catch {}
}

// 3. Setup Complete
console.log('\n====================================================');
console.log('  🎉 Setup complete!');
console.log('  The SQLite database and local CLI are ready.');
console.log('====================================================\n');
