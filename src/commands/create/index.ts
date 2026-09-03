import path from 'path';
import { executeScaffold, CreateOptions } from './scaffold.js';
import { promptForVariables } from './prompts.js';
import { TemplateEngine } from '../../core/scaffolding/index.js';
import { logger } from '../../utils/logger/index.js';

export async function createCommand(
  projectType: string,
  projectName: string,
  options: CreateOptions
): Promise<void> {
  const templateName = options.template || projectType;
  const templatePath = path.resolve(process.cwd(), '.agents', 'templates', `${templateName}.yml`);

  let variables: Record<string, string> = {
    PROJECT_NAME: projectName,
  };

  if (!options.dryRun && process.stdin.isTTY) {
    try {
      const template = TemplateEngine.parseTemplateFile(templatePath);
      variables = await promptForVariables(template, variables);
    } catch {
      // Template loading error will be handled by executeScaffold
    }
  }

  await executeScaffold(projectType, projectName, variables, options);
}

export * from './scaffold.js';
export * from './prompts.js';
