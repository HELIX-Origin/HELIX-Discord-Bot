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
