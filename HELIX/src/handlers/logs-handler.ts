import pc from 'picocolors';

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export const logs = {
  info: (msg: string) => console.log(`${pc.dim(timestamp())} ${pc.cyan('ℹ')} ${msg}`),
  success: (msg: string) => console.log(`${pc.dim(timestamp())} ${pc.green('✔')} ${pc.bold(msg)}`),
  warn: (msg: string) => console.log(`${pc.dim(timestamp())} ${pc.yellow('⚠')} ${pc.yellow(msg)}`),
  error: (msg: string) => console.error(`${pc.dim(timestamp())} ${pc.red('✖')} ${pc.red(pc.bold(msg))}`),
  debug: (msg: string) => {
    if (process.env.DEBUG === '1' || process.env.DEBUG === 'true') {
      console.log(`${pc.dim(timestamp())} ${pc.magenta('🔍')} ${pc.dim(msg)}`);
    }
  },
  title: (msg: string) => console.log('\n' + pc.bold(pc.cyan(msg))),
  divider: () => console.log(pc.dim('─'.repeat(60))),
};
