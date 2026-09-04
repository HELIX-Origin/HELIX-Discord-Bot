import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  default?: string;
}

export interface ProjectTemplate {
  project_type: string;
  framework: string;
  language: string;
  setup_command: string;
  run_command: string;
  build_command: string;
  template_variables?: TemplateVariable[];
}

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svgz',
  '.wav', '.mp3', '.ogg', '.flac',
  '.ttf', '.otf', '.woff', '.woff2',
  '.fbx', '.blend', '.obj', '.dae', '.glb', '.gltf',
  '.zip', '.tar', '.gz', '.7z',
  '.exe', '.dll', '.so', '.dylib',
  '.pdf'
]);

export class TemplateEngine {
  public static isBinary(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return BINARY_EXTENSIONS.has(ext);
  }

  private static defaultTemplates: Record<string, ProjectTemplate> = {
    'discord-bot': {
      project_type: 'discord-bot',
      framework: 'discord.js',
      language: 'typescript',
      setup_command: 'npm install discord.js @discordjs/voice ffmpeg-static',
      run_command: 'npm start',
      build_command: 'npm run build',
      template_variables: [
        { name: 'DISCORD_TOKEN', description: 'Discord bot token', required: true },
        { name: 'CLIENT_ID', description: 'Application client ID', required: true },
        { name: 'GUILD_ID', description: 'Guild ID for development', required: false },
      ],
    },
    'web-react': {
      project_type: 'web',
      framework: 'react',
      language: 'typescript',
      setup_command: 'npm install',
      run_command: 'npm run dev',
      build_command: 'npm run build',
      template_variables: [
        { name: 'PROJECT_NAME', description: 'Web application name', required: false, default: 'helix-web-app' },
      ],
    },
    'web': {
      project_type: 'web',
      framework: 'react',
      language: 'typescript',
      setup_command: 'npm install',
      run_command: 'npm run dev',
      build_command: 'npm run build',
      template_variables: [
        { name: 'PROJECT_NAME', description: 'Web application name', required: false, default: 'helix-web-app' },
      ],
    },
    'web-vue': {
      project_type: 'web',
      framework: 'vue',
      language: 'typescript',
      setup_command: 'npm install',
      run_command: 'npm run dev',
      build_command: 'npm run build',
      template_variables: [
        { name: 'PROJECT_NAME', description: 'Vue application name', required: false, default: 'helix-vue-app' },
      ],
    },
    'desktop-electron': {
      project_type: 'desktop',
      framework: 'electron',
      language: 'typescript',
      setup_command: 'npm install',
      run_command: 'npm run dev',
      build_command: 'npm run build',
      template_variables: [
        { name: 'APP_TITLE', description: 'Desktop application title', required: false, default: 'HELIX Desktop' },
      ],
    },
    'desktop': {
      project_type: 'desktop',
      framework: 'electron',
      language: 'typescript',
      setup_command: 'npm install',
      run_command: 'npm run dev',
      build_command: 'npm run build',
      template_variables: [
        { name: 'APP_TITLE', description: 'Desktop application title', required: false, default: 'HELIX Desktop' },
      ],
    },
    'desktop-tauri': {
      project_type: 'desktop',
      framework: 'tauri',
      language: 'rust',
      setup_command: 'cargo check',
      run_command: 'cargo tauri dev',
      build_command: 'cargo tauri build',
      template_variables: [
        { name: 'APP_IDENTIFIER', description: 'App bundle identifier', required: false, default: 'com.helix.desktop' },
      ],
    },
    'mobile-flutter': {
      project_type: 'mobile',
      framework: 'flutter',
      language: 'dart',
      setup_command: 'flutter pub get',
      run_command: 'flutter run',
      build_command: 'flutter build',
      template_variables: [
        { name: 'PACKAGE_NAME', description: 'Android/iOS package identifier', required: false, default: 'com.helix.mobile' },
      ],
    },
    'mobile': {
      project_type: 'mobile',
      framework: 'react-native',
      language: 'typescript',
      setup_command: 'npm install',
      run_command: 'npx expo start',
      build_command: 'npx expo export',
      template_variables: [
        { name: 'APP_NAME', description: 'Expo application name', required: false, default: 'helix-mobile-app' },
      ],
    },
    'mobile-react-native': {
      project_type: 'mobile',
      framework: 'react-native',
      language: 'typescript',
      setup_command: 'npm install',
      run_command: 'npx expo start',
      build_command: 'npx expo export',
      template_variables: [
        { name: 'APP_NAME', description: 'Expo application name', required: false, default: 'helix-mobile-app' },
      ],
    },
    'game-godot': {
      project_type: 'game-engine',
      framework: 'godot',
      language: 'gdscript',
      setup_command: '',
      run_command: 'godot --path . -e',
      build_command: 'godot --headless --export-release "HTML5" dist/',
      template_variables: [
        { name: 'GAME_TITLE', description: 'Godot game title', required: false, default: 'HELIX Godot Game' },
      ],
    },
    'game-unity': {
      project_type: 'game-engine',
      framework: 'unity',
      language: 'csharp',
      setup_command: '',
      run_command: 'Unity -projectPath .',
      build_command: 'Unity -batchmode -quit -buildWindows64',
      template_variables: [
        { name: 'GAME_TITLE', description: 'Unity game title', required: false, default: 'HELIX Unity Project' },
      ],
    },
    'game-engine': {
      project_type: 'game-engine',
      framework: 'unity',
      language: 'csharp',
      setup_command: '',
      run_command: 'Unity -projectPath .',
      build_command: 'Unity -batchmode -quit -buildWindows64',
      template_variables: [
        { name: 'GAME_TITLE', description: 'Unity game title', required: false, default: 'HELIX Unity Project' },
      ],
    },
    'game-rpgm': {
      project_type: 'game-engine',
      framework: 'rpg-maker',
      language: 'javascript',
      setup_command: '',
      run_command: '',
      build_command: '',
      template_variables: [
        { name: 'PLUGIN_NAME', description: 'RPG Maker plugin name', required: false, default: 'HelixPlugin' },
      ],
    },
    'game-renpy': {
      project_type: 'game-engine',
      framework: 'renpy',
      language: 'python',
      setup_command: '',
      run_command: 'renpy . run',
      build_command: 'renpy . build',
      template_variables: [
        { name: 'NOVEL_TITLE', description: "Ren'Py novel title", required: false, default: 'HELIX Visual Novel' },
      ],
    },
    'backend-rust': {
      project_type: 'backend',
      framework: 'axum',
      language: 'rust',
      setup_command: 'cargo check',
      run_command: 'cargo run',
      build_command: 'cargo build --release',
      template_variables: [
        { name: 'SERVICE_NAME', description: 'Rust Axum service name', required: false, default: 'helix-service' },
      ],
    },
    'backend-go': {
      project_type: 'backend',
      framework: 'http',
      language: 'go',
      setup_command: 'go mod tidy',
      run_command: 'go run main.go',
      build_command: 'go build',
      template_variables: [
        { name: 'MODULE_PATH', description: 'Go module path', required: false, default: 'github.com/helix/service' },
      ],
    },
    'backend-java': {
      project_type: 'backend',
      framework: 'spring-boot',
      language: 'java',
      setup_command: 'mvn clean install',
      run_command: 'mvn spring-boot:run',
      build_command: 'mvn package',
      template_variables: [
        { name: 'GROUP_ID', description: 'Maven group ID', required: false, default: 'com.helix.backend' },
      ],
    },
    'backend-python': {
      project_type: 'backend',
      framework: 'fastapi',
      language: 'python',
      setup_command: 'uv sync',
      run_command: 'uv run fastapi dev src/app/main.py',
      build_command: 'uv build',
      template_variables: [
        { name: 'PACKAGE_NAME', description: 'Python package name', required: false, default: 'helix_service' },
      ],
    },
    'backend': {
      project_type: 'backend',
      framework: 'fastapi',
      language: 'python',
      setup_command: 'uv sync',
      run_command: 'uv run fastapi dev src/app/main.py',
      build_command: 'uv build',
      template_variables: [
        { name: 'PACKAGE_NAME', description: 'Python package name', required: false, default: 'helix_service' },
      ],
    },
  };

  public static getDefaultTemplate(templateName: string): ProjectTemplate | null {
    return this.defaultTemplates[templateName] || null;
  }

  public static getAllDefaultTemplates(): Record<string, ProjectTemplate> {
    return { ...this.defaultTemplates };
  }

  public static loadTemplate(templateName: string, filePath?: string): ProjectTemplate {
    if (filePath && fs.existsSync(filePath)) {
      try {
        return this.parseTemplateFile(filePath);
      } catch {}
    }
    const fallback = this.getDefaultTemplate(templateName);
    if (fallback) return fallback;
    if (filePath) {
      return this.parseTemplateFile(filePath);
    }
    throw new Error(`Template not found: ${templateName}`);
  }

  public static parseTemplateFile(filePath: string): ProjectTemplate {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template file not found at: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return yaml.parse(content) as ProjectTemplate;
  }

  public static resolveVariables(
    template: ProjectTemplate,
    provided: Record<string, string>
  ): { resolved: Record<string, string>; missing: string[] } {
    const resolved: Record<string, string> = { ...provided };
    const missing: string[] = [];

    if (template.template_variables) {
      for (const v of template.template_variables) {
        if (resolved[v.name] === undefined || resolved[v.name] === '') {
          if (v.default !== undefined) {
            resolved[v.name] = v.default;
          } else if (v.required) {
            missing.push(v.name);
          }
        }
      }
    }

    return { resolved, missing };
  }

  public static interpolate(content: string, variables: Record<string, string>): string {
    return content.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  public static processFile(
    sourcePath: string,
    variables: Record<string, string>
  ): { isBinary: boolean; content: Buffer | string } {
    if (this.isBinary(sourcePath)) {
      return {
        isBinary: true,
        content: fs.readFileSync(sourcePath),
      };
    } else {
      const text = fs.readFileSync(sourcePath, 'utf-8');
      return {
        isBinary: false,
        content: this.interpolate(text, variables),
      };
    }
  }
}
