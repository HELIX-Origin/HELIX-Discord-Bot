import { helpCommand } from './help.js';
import { aiCommand } from './ai.js';
import { authCommand } from './auth.js';
import { explainCommand } from './explain.js';
import { scaffoldCommand } from './scaffold.js';
import { statusCommand } from './status.js';
import { repoCommand } from './repo.js';

export const botCommands = [
  helpCommand,
  aiCommand,
  authCommand,
  explainCommand,
  scaffoldCommand,
  statusCommand,
  repoCommand,
];

export * from './help.js';
export * from './ai.js';
export * from './auth.js';
export * from './explain.js';
export * from './scaffold.js';
export * from './status.js';
export * from './repo.js';
