import path from 'path';
import { TemplateEngine } from './template-engine.js';
import { FileGenerator, type FileToGenerate } from './file-generator.js';
import { getDomainFiles } from './generators/generators.js';

export interface CreateOptions {
  template?: string;
  language?: string;
  framework?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
  dryRun?: boolean;
  gitPlatform?: 'github' | 'gitlab' | 'bitbucket' | 'none';
  repoVisibility?: 'public' | 'private';
}

export interface ScaffoldResult {
  success: boolean;
  writtenFiles: string[];
  targetDir: string;
  templateName: string;
  dryRun: boolean;
}

/**
 * In-process project scaffolding runner for the HELIX bot.
 *
 * Generates a complete starter project on disk (or a dry-run manifest) using the
 * in-repo template engine, domain generators, and optional CI/CD pipeline files.
 * Hosting-platform and package-manager orchestration (git init, remote repo
 * creation, dependency install) are deliberately out of scope for the embedded
 * bot runtime. The bot generates blueprints; the user runs install/setup locally.
 */
export async function executeScaffold(
  projectType: string,
  projectName: string,
  variables: Record<string, string>,
  options: CreateOptions = {}
): Promise<ScaffoldResult> {
  const targetDir = path.resolve(projectName);
  const templateName = options.template || projectType;

  const template = TemplateEngine.loadTemplate(templateName, undefined);

  const { resolved, missing } = TemplateEngine.resolveVariables(template, variables);
  if (missing.length > 0) {
    return {
      success: false,
      writtenFiles: [],
      targetDir,
      templateName,
      dryRun: Boolean(options.dryRun),
    };
  }

  const files: FileToGenerate[] = [
    ...FileGenerator.getBaselineFiles(projectName, templateName),
    {
      relativePath: '.env.example',
      content: `# Environment variables for ${projectName}\n` +
        Object.entries(resolved)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n') + '\n',
    },
  ];

  const domainFiles = getDomainFiles(
    templateName,
    projectName,
    template,
    resolved,
    options.gitPlatform
  );
  files.push(...domainFiles);

  const written = FileGenerator.writeFiles(targetDir, files, Boolean(options.dryRun));

  return {
    success: true,
    writtenFiles: written,
    targetDir,
    templateName,
    dryRun: Boolean(options.dryRun),
  };
}
