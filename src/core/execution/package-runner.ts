import { execSync } from 'child_process';

export class PackageRunner {
  public static execute(command: string, cwd: string): { success: boolean; output: string } {
    try {
      const output = execSync(command, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf-8',
        timeout: 120000,
      });
      return { success: true, output };
    } catch (err: any) {
      const output = (err.stdout || '') + '\n' + (err.stderr || err.message || '');
      return { success: false, output };
    }
  }
}
