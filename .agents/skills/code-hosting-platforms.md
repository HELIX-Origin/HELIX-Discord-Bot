# Skill: Code Hosting Platforms & Official CLI Management

## Overview
Standards, automation recipes, and credential discovery patterns for managing remote repositories across **GitHub** (via `gh`), **GitLab** (via `glab`), **Bitbucket**, and generic Git remotes.

## 1. GitHub CLI (`gh`) Integration

### Detection & Authentication Check
```typescript
import { execSync } from 'child_process';

export function isGitHubCliAvailable(): boolean {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function isGitHubAuthenticated(): boolean {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
```

### Remote Repository Creation Recipe
```bash
# Create remote repo and link local repository
gh repo create <project-name> --public --source=. --remote=origin --push
# Or private
gh repo create <project-name> --private --source=. --remote=origin --push
```

---

## 2. GitLab CLI (`glab`) Integration

### Detection & Authentication Check
```typescript
export function isGitLabCliAvailable(): boolean {
  try {
    execSync('glab --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function isGitLabAuthenticated(): boolean {
  try {
    execSync('glab auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
```

### Remote Repository Creation Recipe
```bash
# Create remote repo and push
glab repo create <project-name> --public --remote=origin --push
# Or private
glab repo create <project-name> --private --remote=origin --push
```

---

## 3. Bitbucket & Generic Git Integration

### Bitbucket Remote Setup
When official CLI is not installed, HELIX CLI configures standard Git remotes and generates Bitbucket Pipelines:
```bash
git remote add origin https://bitbucket.org/<workspace>/<project-name>.git
git push -u origin main
```

### Authentication Fallback via `.env`
When official CLIs are not installed or authenticated, HELIX CLI checks for tokens in `.env`:
- `GITHUB_TOKEN`: Fallback for GitHub API operations.
- `GITLAB_TOKEN`: Fallback for GitLab API operations.
- `BITBUCKET_USERNAME` & `BITBUCKET_APP_PASSWORD`: Fallback for Bitbucket operations.

---

## CI/CD Pipeline Automation

HELIX CLI scaffolds platform-appropriate pipeline templates:
- **GitHub**: `.github/workflows/ci.yml`
- **GitLab**: `.gitlab-ci.yml`
- **Bitbucket**: `bitbucket-pipelines.yml`
