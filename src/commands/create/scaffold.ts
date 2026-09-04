import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import ora from 'ora';
import { logger } from '../../utils/logger/index.js';
import { TemplateEngine, FileGenerator, FileToGenerate } from '../../core/scaffolding/index.js';
import { getDomainFiles } from '../../core/scaffolding/generators/index.js';
import { PackageRunner } from '../../core/execution/index.js';
import { RepoManager } from '../../core/hosting/index.js';

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

export async function executeScaffold(
  projectType: string,
  projectName: string,
  variables: Record<string, string>,
  options: CreateOptions
): Promise<void> {
  const targetDir = path.resolve(process.cwd(), projectName);
  const templateName = options.template || projectType;

  // Resolve template file path
  const templatePath = path.resolve(process.cwd(), '.agents', 'templates', `${templateName}.yml`);

  let template;
  try {
    template = TemplateEngine.loadTemplate(templateName, templatePath);
  } catch (err: any) {
    logger.error(`Could not load template "${templateName}": ${err.message}`);
    return;
  }

  // Resolve variables
  const { resolved, missing } = TemplateEngine.resolveVariables(template, variables);
  if (missing.length > 0) {
    logger.error(`Missing required template variables: ${missing.join(', ')}`);
    return;
  }

  logger.title(`Scaffolding ${pc.bold(projectName)} [${template.project_type} / ${template.framework}]`);
  if (options.dryRun) {
    logger.warn('Running in DRY-RUN mode. No files will be created.');
  }

  // Generate baseline files
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

  // Specialized domain and CI/CD files
  const domainFiles = getDomainFiles(
    templateName,
    projectName,
    template,
    resolved,
    options.gitPlatform
  );
  files.push(...domainFiles);

  // Write files
  const written = FileGenerator.writeFiles(targetDir, files, options.dryRun);

  for (const f of written) {
    console.log(`  ${pc.green('+')} ${pc.dim(path.relative(process.cwd(), f))}`);
  }

  if (options.dryRun) {
    logger.success(`Dry run complete. ${written.length} files planned.`);
    return;
  }

  // Git Initialization
  if (!options.skipGit && RepoManager.isGitInstalled()) {
    const gitSpinner = ora('Initializing local Git repository...').start();
    try {
      RepoManager.initLocalGit(targetDir);
      gitSpinner.succeed('Initialized local Git repository');

      // Remote repository creation via official CLI if requested
      if (options.gitPlatform && options.gitPlatform !== 'none') {
        const remoteSpinner = ora(`Creating remote repository on ${options.gitPlatform.toUpperCase()}...`).start();
        const result = RepoManager.createRemoteRepo({
          platform: options.gitPlatform,
          repoName: projectName,
          visibility: options.repoVisibility || 'public',
          cwd: targetDir,
        });
        if (result.success) {
          remoteSpinner.succeed(result.message);
        } else {
          remoteSpinner.warn(`Remote repo note: ${result.message}`);
        }
      }
    } catch {
      gitSpinner.warn('Git initialization skipped');
    }
  }

  // Dependency installation
  if (!options.skipInstall && template.setup_command) {
    const installSpinner = ora(`Running setup: ${template.setup_command}...`).start();
    const result = PackageRunner.execute(template.setup_command, targetDir);
    if (result.success) {
      installSpinner.succeed('Dependencies and tooling set up successfully');
    } else {
      installSpinner.warn(`Setup command finished with notes (can run manually later)`);
    }
  }

  logger.title('Project Created Successfully!');
  console.log(`  ${pc.bold('Next steps:')}`);
  console.log(`    cd ${projectName}`);
  if (template.run_command) {
    console.log(`    ${template.run_command}`);
  }
  console.log();
}
