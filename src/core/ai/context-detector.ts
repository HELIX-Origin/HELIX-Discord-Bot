import fs from 'fs';
import path from 'path';

export interface ProjectContext {
  projectType: string;
  framework: string;
  language: string;
  dependencies: string[];
  keyFiles: string[];
  hasGit: boolean;
}

export class ContextDetector {
  /**
   * Inspect a directory and identify the project framework and structure
   */
  public static detect(cwd: string = process.cwd()): ProjectContext {
    const files = fs.existsSync(cwd) ? fs.readdirSync(cwd) : [];
    const hasGit = files.includes('.git');
    const keyFiles: string[] = [];
    const dependencies: string[] = [];

    // Check Discord Bot / Node.js
    if (files.includes('package.json')) {
      keyFiles.push('package.json');
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        dependencies.push(...Object.keys(deps));

        if (deps['discord.js']) {
          return {
            projectType: 'discord-bot',
            framework: 'discord.js',
            language: files.includes('tsconfig.json') ? 'typescript' : 'javascript',
            dependencies,
            keyFiles,
            hasGit,
          };
        }

        if (deps['@tauri-apps/api'] || files.includes('src-tauri')) {
          return {
            projectType: 'desktop',
            framework: 'tauri',
            language: 'rust-typescript',
            dependencies,
            keyFiles,
            hasGit,
          };
        }

        if (deps['electron']) {
          return {
            projectType: 'desktop',
            framework: 'electron',
            language: files.includes('tsconfig.json') ? 'typescript' : 'javascript',
            dependencies,
            keyFiles,
            hasGit,
          };
        }

        if (deps['vue']) {
          return {
            projectType: 'web',
            framework: 'vue',
            language: files.includes('tsconfig.json') ? 'typescript' : 'javascript',
            dependencies,
            keyFiles,
            hasGit,
          };
        }

        if (deps['react']) {
          return {
            projectType: 'web',
            framework: 'react',
            language: files.includes('tsconfig.json') ? 'typescript' : 'javascript',
            dependencies,
            keyFiles,
            hasGit,
          };
        }
      } catch {}
    }

    // Check Rust
    if (files.includes('Cargo.toml')) {
      keyFiles.push('Cargo.toml');
      return {
        projectType: 'backend',
        framework: 'axum / cargo',
        language: 'rust',
        dependencies,
        keyFiles,
        hasGit,
      };
    }

    // Check Go
    if (files.includes('go.mod')) {
      keyFiles.push('go.mod');
      return {
        projectType: 'backend',
        framework: 'standard-library',
        language: 'go',
        dependencies,
        keyFiles,
        hasGit,
      };
    }

    // Check Godot
    if (files.includes('project.godot')) {
      keyFiles.push('project.godot');
      return {
        projectType: 'game-engine',
        framework: 'godot',
        language: 'gdscript',
        dependencies,
        keyFiles,
        hasGit,
      };
    }

    // Check Python
    if (files.includes('pyproject.toml') || files.includes('requirements.txt')) {
      keyFiles.push(files.includes('pyproject.toml') ? 'pyproject.toml' : 'requirements.txt');
      return {
        projectType: 'backend',
        framework: 'fastapi / python',
        language: 'python',
        dependencies,
        keyFiles,
        hasGit,
      };
    }

    // Check Flutter
    if (files.includes('pubspec.yaml')) {
      keyFiles.push('pubspec.yaml');
      return {
        projectType: 'mobile',
        framework: 'flutter',
        language: 'dart',
        dependencies,
        keyFiles,
        hasGit,
      };
    }

    return {
      projectType: 'generic',
      framework: 'unknown',
      language: 'unknown',
      dependencies,
      keyFiles,
      hasGit,
    };
  }
}
