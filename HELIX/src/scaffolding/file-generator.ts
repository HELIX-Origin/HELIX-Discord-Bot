import fs from 'fs';
import path from 'path';
import { generateProjectReadme } from './generators/readme-generator.js';

export interface FileToGenerate {
  relativePath: string;
  content: string | Buffer;
  isBinary?: boolean;
}

export class FileGenerator {
  public static writeFiles(targetDir: string, files: FileToGenerate[], dryRun: boolean = false): string[] {
    const writtenFiles: string[] = [];

    for (const file of files) {
      const fullPath = path.join(targetDir, file.relativePath);
      writtenFiles.push(fullPath);

      if (!dryRun) {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (file.isBinary && Buffer.isBuffer(file.content)) {
          fs.writeFileSync(fullPath, file.content);
        } else {
          fs.writeFileSync(fullPath, file.content.toString(), 'utf-8');
        }
      }
    }

    return writtenFiles;
  }

  public static getBaselineFiles(projectName: string, templateId: string, variables: Record<string, string> = {}): FileToGenerate[] {
    return [
      {
        relativePath: 'README.md',
        content: generateProjectReadme(templateId, projectName, variables),
      },
      {
        relativePath: '.gitignore',
        content: `node_modules/
dist/
build/
bin/
.env
*.log
.DS_Store
Thumbs.db
target/
.venv/
__pycache__/
*.pyc
`,
      },
    ];
  }
}
