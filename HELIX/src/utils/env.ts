import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

let envLoaded = false;

export function getEnvPaths(): string[] {
  return [
    path.resolve(process.cwd(), '.env'),
    path.resolve(os.homedir(), '.helix', '.env'),
    path.resolve(os.homedir(), '.env'),
  ];
}

export function loadEnv(): void {
  if (envLoaded) return;

  for (const envPath of getEnvPaths()) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  }

  // Fallback to default dotenv lookup
  dotenv.config();
  envLoaded = true;
}

export function saveEnvValue(key: string, value: string, customPath?: string): string {
  const envPath = customPath || path.resolve(process.cwd(), '.env');
  let content = '';

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
  }

  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content ? `${content.trimEnd()}\n${key}=${value}\n` : `${key}=${value}\n`;
  }

  fs.writeFileSync(envPath, content, 'utf-8');
  process.env[key] = value;
  return envPath;
}

export function parseEnvFile(customPath?: string): Record<string, string> {
  const envPath = customPath || path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};

  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    return dotenv.parse(content);
  } catch {
    return {};
  }
}
