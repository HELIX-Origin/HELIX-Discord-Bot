import pc from 'picocolors';

export const logger = {
  info: (msg: string) => console.log(pc.cyan('ℹ ') + msg),
  success: (msg: string) => console.log(pc.green('✔ ') + pc.bold(msg)),
  warn: (msg: string) => console.log(pc.yellow('⚠ ') + pc.yellow(msg)),
  error: (msg: string) => console.error(pc.red('✖ ') + pc.red(pc.bold(msg))),
  title: (msg: string) => console.log('\n' + pc.bold(pc.cyan(msg))),
  dim: (msg: string) => console.log(pc.dim(msg)),
  divider: () => console.log(pc.dim('─'.repeat(60))),
};

export default logger;
