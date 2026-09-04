# Contributing to HELIX CLI

Thank you for your interest in contributing to HELIX CLI! We welcome contributions from developers of all skill levels.

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites
- **Node.js**: `v22.0.0` or higher (uses native `node:sqlite`)
- **Git**: `2.30.0` or higher
- **GitHub CLI (`gh`)**: Recommended for code-hosting commands

### Development Setup

1. Fork the repository on GitHub: `https://github.com/HELIX-Origin/HELIX-CLI`
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/HELIX-CLI.git
   cd HELIX-CLI
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Run the test suite:
   ```bash
   npm test
   ```

## Development Workflow

1. Create a descriptive branch from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   # or
   git checkout -b fix/issue-description
   ```
2. Make your modifications adhering to TypeScript best practices and project conventions.
3. Verify your changes pass all local verification scripts:
   ```bash
   npm run typecheck       # Verify TypeScript types without errors
   npm run test:unit       # In-memory unit tests
   npm run test:integration # Filesystem scaffolding integration tests
   npm run build           # Verify dual ESM bundling
   ```
4. Commit your changes using conventional commit messages:
   - `feat(area): description`
   - `fix(area): description`
   - `docs: description`
   - `test: description`
   - `refactor: description`
5. Push to your fork and submit a Pull Request against the `main` branch.

## Submitting Pull Requests

- Provide a concise title following conventional commits.
- Fill out all sections in the [Pull Request Template](.github/pull_request_template.md).
- Ensure the CI matrix tests pass across Linux, Windows, and macOS.
