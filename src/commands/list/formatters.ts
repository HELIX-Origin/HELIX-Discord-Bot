import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import { logger } from '../../utils/logger/index.js';
import { TemplateEngine } from '../../core/scaffolding/index.js';

export function listAgents(agentsDir: string): void {
  logger.title('Available Project & Integration Agents:');
  if (fs.existsSync(agentsDir)) {
    const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md') && f !== 'index.md');
    for (const file of files) {
      const id = file.replace('.md', '');
      console.log(`  ${pc.cyan('•')} ${pc.bold(id)} ${pc.dim(`(.agents/agents/${file})`)}`);
    }
  } else {
    logger.warn('Agents directory not found.');
  }
}

export function listSkills(skillsDir: string): void {
  logger.title('Available Skills:');
  if (fs.existsSync(skillsDir)) {
    const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md') && f !== 'index.md');
    for (const file of files) {
      const id = file.replace('.md', '');
      console.log(`  ${pc.magenta('•')} ${pc.bold(id)} ${pc.dim(`(.agents/skills/${file})`)}`);
    }
  } else {
    logger.warn('Skills directory not found.');
  }
}

export function listTemplates(templatesDir: string): void {
  logger.title('Available Scaffolding Templates:');
  if (fs.existsSync(templatesDir)) {
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.yml'));
    for (const file of files) {
      const id = file.replace('.yml', '');
      try {
        const tpl = TemplateEngine.parseTemplateFile(path.join(templatesDir, file));
        console.log(
          `  ${pc.green('•')} ${pc.bold(id.padEnd(22))} ${pc.dim(`[${tpl.project_type}]`)} ${pc.yellow(tpl.framework)} (${tpl.language})`
        );
      } catch {
        console.log(`  ${pc.green('•')} ${pc.bold(id)}`);
      }
    }
  } else {
    logger.warn('Templates directory not found.');
  }
}
