import path from 'path';
import { listAgents, listSkills, listTemplates } from './formatters.js';

export async function listCommand(category?: string): Promise<void> {
  const rootDir = process.cwd();
  const agentsDir = path.join(rootDir, '.agents', 'agents');
  const skillsDir = path.join(rootDir, '.agents', 'skills');
  const templatesDir = path.join(rootDir, '.agents', 'templates');

  const showAll = !category || category === 'all';

  if (showAll || category === 'agents') {
    listAgents(agentsDir);
  }

  if (showAll || category === 'skills') {
    listSkills(skillsDir);
  }

  if (showAll || category === 'templates') {
    listTemplates(templatesDir);
  }

  console.log();
}

export * from './formatters.js';
