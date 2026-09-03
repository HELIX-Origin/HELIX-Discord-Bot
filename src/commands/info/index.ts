import { showSystemInfo } from './system.js';

export async function infoCommand(): Promise<void> {
  showSystemInfo();
}

export * from './system.js';
