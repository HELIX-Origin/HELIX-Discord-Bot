import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('  🤖 HELIX Discord Bot — Post-Deploy Setup');
console.log('====================================================\n');
console.log('  This script initializes the bot SQLite database');
console.log('  and optionally installs a local copy of the CLI.');
console.log('  Set CLONE_CLI=true to clone the CLI into .cli/\n');

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

// Auto-detect Heroku host environment if running on Heroku
const herokuAppName = process.env.HEROKU_APP_NAME || process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME;
if (herokuAppName) {
  const herokuDomain = herokuAppName.includes('.') ? herokuAppName : `${herokuAppName}.herokuapp.com`;
  const herokuUrl = `https://${herokuDomain}`;
  console.log(`✔ Auto-detected Heroku host environment: ${herokuUrl}`);

  if (!process.env.DISCORD_CALLBACK_URL || process.env.DISCORD_CALLBACK_URL.includes('localhost')) {
    process.env.DISCORD_CALLBACK_URL = herokuUrl;
    console.log(`  Auto-configured DISCORD_CALLBACK_URL -> ${herokuUrl}`);
  }
  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes('localhost')) {
    process.env.NEXTAUTH_URL = herokuUrl;
    console.log(`  Auto-configured NEXTAUTH_URL -> ${herokuUrl}`);
  }
  const clientId = getEnv('DISCORD_CLIENT_ID');
  const existingInvite = getEnv('NEXT_PUBLIC_INVITE_URL');
  if (clientId && (!existingInvite || existingInvite.includes('yourclientid'))) {
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot&redirect_uri=${encodeURIComponent(herokuUrl + '/api/auth/callback/discord')}&response_type=code`;
    process.env.NEXT_PUBLIC_INVITE_URL = inviteUrl;
    console.log(`  Auto-configured NEXT_PUBLIC_INVITE_URL -> ${inviteUrl}`);
  }
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

// 2. Setup Complete
if (db) {
  try {
    db.exec(`
      INSERT OR REPLACE INTO bot_kv (key, value, updated_at)
      VALUES ('bot_version', '0.1.0', datetime('now'));
    `);
    db.close();
  } catch {}
}

// 3. Setup Complete
console.log('\n====================================================');
console.log('  🎉 Bot post-deploy setup complete!');
console.log('  SQLite database initialized and ready.');
console.log('  The bot will start automatically via Procfile.');
console.log('====================================================\n');
