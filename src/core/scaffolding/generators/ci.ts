import { FileToGenerate } from '../file-generator.js';
import { ProjectTemplate } from '../template-engine.js';

export function generateCiPipelineFiles(
  platform: 'github' | 'gitlab' | 'bitbucket',
  template: ProjectTemplate
): FileToGenerate[] {
  if (platform === 'github') {
    let testStep = 'npm test';
    if (template.language === 'rust') testStep = 'cargo test';
    else if (template.language === 'go') testStep = 'go test ./...';
    else if (template.language === 'python') testStep = 'pytest';
    else if (template.language === 'java') testStep = './mvnw test';

    return [
      {
        relativePath: '.github/workflows/ci.yml',
        content: `name: CI Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Build
        run: ${template.build_command || 'echo "No build specified"'}

      - name: Run Tests
        run: ${testStep}
`,
      },
    ];
  }

  if (platform === 'gitlab') {
    return [
      {
        relativePath: '.gitlab-ci.yml',
        content: `stages:
  - build
  - test

build-job:
  stage: build
  script:
    - ${template.build_command || 'echo "Build step completed"'}

test-job:
  stage: test
  script:
    - echo "Running tests..."
`,
      },
    ];
  }

  if (platform === 'bitbucket') {
    return [
      {
        relativePath: 'bitbucket-pipelines.yml',
        content: `image: node:20

pipelines:
  default:
    - step:
        name: Build & Test
        script:
          - ${template.build_command || 'echo "Build step completed"'}
`,
      },
    ];
  }

  return [];
}
