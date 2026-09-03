import { createCli } from './cli.js';
import { logger } from './utils/logger/index.js';
import { loadEnv } from './utils/env/index.js';

// Centralized environment loading across project and home directories
loadEnv();

async function main() {
  const program = createCli();

  try {
    await program.parseAsync(process.argv);
  } catch (error: any) {
    logger.error(`HELIX CLI encountered an error: ${error.message || error}`);
    process.exit(1);
  }
}

main();
