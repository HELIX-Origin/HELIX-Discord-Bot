import type { AppDeps } from '../../app.js';
import { type ApplicationCommand } from '../utils/types.js';
import { feedCommandDef } from './feeds/feed.js';
import { gifCommandDef } from './entertainment/gif.js';
import { setCommandDef } from './admin/set.js';
import { welcomeCommandDef } from './admin/welcome.js';
import { ticketCommandDef } from './admin/ticket.js';
import { aboutCommandDef } from './utility/about.js';
import { helpCommandDef } from './utility/help.js';
import { statsCommandDef } from './utility/stats.js';
import { musicCommandDefs } from './music/music.js';

export function getEnabledCommands(deps: AppDeps): ApplicationCommand[] {
  const f = deps.config.features;
  const commands: ApplicationCommand[] = [aboutCommandDef, statsCommandDef, helpCommandDef];
  if (f.feedsEnabled) commands.push(feedCommandDef);
  if (f.gifsEnabled && deps.config.klipyApiKey) commands.push(gifCommandDef);
  if (f.administrationEnabled) commands.push(setCommandDef, welcomeCommandDef, ticketCommandDef);
  if (f.lavaEnabled) commands.push(...musicCommandDefs);
  return commands;
}
