import path from 'path';
import { TemplateEngine } from './template-engine.js';
import { FileGenerator, type FileToGenerate } from './file-generator.js';
import { getDomainFiles } from './generators/generators.js';
import { createZipArchive } from './archive-builder.js';

export interface CreateOptions {
  template?: string;
  language?: string;
  framework?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
  dryRun?: boolean;
  writeToDisk?: boolean;
  gitPlatform?: 'github' | 'gitlab' | 'bitbucket' | 'none';
  repoVisibility?: 'public' | 'private';
}

export interface ScaffoldResult {
  success: boolean;
  writtenFiles: string[];
  files: FileToGenerate[];
  archiveBuffer?: Buffer;
  targetDir: string;
  templateName: string;
  dryRun: boolean;
}

/**
 * In-process project scaffolding runner for the HELIX bot.
 *
 * Generates a complete starter project in-memory (and optionally on disk or dry-run)
 * using the in-repo template engine, domain generators, and optional CI/CD pipeline files.
 * Builds a clean ZIP archive for database persistence and Discord/Dashboard distribution.
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
      files: [],
      targetDir,
      templateName,
      dryRun: Boolean(options.dryRun),
    };
  }

  const files: FileToGenerate[] = [
    ...FileGenerator.getBaselineFiles(projectName, templateName, resolved),
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

  const writeDisk = options.writeToDisk !== undefined ? options.writeToDisk : !options.dryRun;
  const written = FileGenerator.writeFiles(targetDir, files, !writeDisk || Boolean(options.dryRun));
  const archiveBuffer = createZipArchive(files, path.basename(projectName));

  return {
    success: true,
    writtenFiles: written,
    files,
    archiveBuffer,
    targetDir,
    templateName,
    dryRun: Boolean(options.dryRun),
  };
}
