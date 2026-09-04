import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../../HELIX/src/scaffolding/template-engine.js';

describe('TemplateEngine', () => {
  it('identifies binary and text files correctly', () => {
    expect(TemplateEngine.isBinary('image.png')).toBe(true);
    expect(TemplateEngine.isBinary('audio.wav')).toBe(true);
    expect(TemplateEngine.isBinary('font.ttf')).toBe(true);
    expect(TemplateEngine.isBinary('model.fbx')).toBe(true);
    expect(TemplateEngine.isBinary('index.ts')).toBe(false);
    expect(TemplateEngine.isBinary('package.json')).toBe(false);
    expect(TemplateEngine.isBinary('README.md')).toBe(false);
  });

  it('interpolates single and multiple variables accurately', () => {
    const template = 'Hello ${PROJECT_NAME}, target is ${TARGET}!';
    const variables = { PROJECT_NAME: 'HelixApp', TARGET: 'Desktop' };
    const result = TemplateEngine.interpolate(template, variables);

    expect(result).toBe('Hello HelixApp, target is Desktop!');
  });

  it('preserves unsupplied placeholder tokens untouched', () => {
    const template = 'Value: ${DEFINED} and ${UNKNOWN}';
    const result = TemplateEngine.interpolate(template, { DEFINED: '123' });

    expect(result).toBe('Value: 123 and ${UNKNOWN}');
  });

  it('resolves default variables and detects missing required variables', () => {
    const mockTemplate = {
      project_type: 'web',
      framework: 'react',
      language: 'typescript',
      setup_command: 'npm install',
      run_command: 'npm run dev',
      build_command: 'npm run build',
      template_variables: [
        { name: 'REQUIRED_VAR', description: 'Req', required: true },
        { name: 'OPTIONAL_VAR', description: 'Opt', required: false, default: 'default-value' },
      ],
    };

    const result = TemplateEngine.resolveVariables(mockTemplate, {});
    expect(result.missing).toContain('REQUIRED_VAR');
    expect(result.resolved['OPTIONAL_VAR']).toBe('default-value');
  });
});
