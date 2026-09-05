/**
 * Environment variable snapshot/restore helper.
 * Prevents process.env mutations from leaking between tests.
 */
const TRACKED_KEYS = new Set<string>();

export function setEnv(key: string, value: string | undefined): void {
  TRACKED_KEYS.add(key);
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

export function clearEnvKeys(): void {
  for (const key of TRACKED_KEYS) {
    delete process.env[key];
  }
  TRACKED_KEYS.clear();
}

export class EnvSandbox {
  private original = new Map<string, string | undefined>();

  set(key: string, value: string | undefined): void {
    if (!this.original.has(key)) this.original.set(key, process.env[key]);
    setEnv(key, value);
  }

  restore(): void {
    for (const [key, value] of this.original) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    this.original.clear();
  }
}