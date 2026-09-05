/**
 * YAML template strings used by the scaffolding engine tests.
 */
export const goodTemplateYaml = `project_type: web
framework: react
language: typescript
setup_command: npm install
run_command: npm run dev
build_command: npm run build
template_variables:
  - name: PROJECT_NAME
    description: Application name
    required: false
    default: helix-app
  - name: API_KEY
    description: Required API key
    required: true
`;

export const minimalTemplateYaml = `project_type: backend
framework: fastapi
language: python
setup_command: uv sync
run_command: uv run dev
build_command: uv build
`;

export const templateWithInterpolation = `project_type: discord-bot
framework: discord.js
language: typescript
setup_command: npm install
run_command: npm start
build_command: npm run build
template_variables:
  - name: DISCORD_TOKEN
    description: Bot token
    required: true
`;

export const templatedFileContent = `export const config = {
  token: process.env.APP_DISCORD_TOKEN || '\${DISCORD_TOKEN}',
  appName: '\${APP_NAME}'
};
`;