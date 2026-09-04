import { helpCommand } from './help.js';
import { createCommand } from './create.js';
import { listCommand } from './list.js';
import { aiCommand } from './ai.js';
import { authCommand } from './auth.js';
import { explainCommand } from './explain.js';
import { scaffoldCommand } from './scaffold.js';
import { statusCommand } from './status.js';
import { repoCommand } from './repo.js';
import { infoCommand } from './info.js';
import { modCommand } from './mod.js';
import { utilCommand } from './util.js';
import { ticketCommand } from './ticket.js';
import { setCommand } from './set.js';

export const botCommands = [
  helpCommand,
  createCommand,
  listCommand,
  aiCommand,
  authCommand,
  explainCommand,
  scaffoldCommand,
  statusCommand,
  repoCommand,
  infoCommand,
  modCommand,
  utilCommand,
  ticketCommand,
  setCommand,
];

export * from './help.js';
export * from './create.js';
export * from './list.js';
export * from './ai.js';
export * from './auth.js';
export * from './explain.js';
export * from './scaffold.js';
export * from './status.js';
export * from './repo.js';
export * from './info.js';
export * from './mod.js';
export * from './util.js';
export * from './ticket.js';
export * from './set.js';

