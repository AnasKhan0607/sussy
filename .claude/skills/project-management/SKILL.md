---
name: project-management
description: GitHub project management for Sussy. Covers issue creation, branch workflows, PR management, and the "no task, no work" principle. Use when discussing tasks, creating issues, or managing the development workflow.
---

# Sussy Project Management

GitHub-based project management following the "no task, no work" principle.

## Core Principles

1. **No Task, No Work**: Every piece of work must have a GitHub issue before starting
2. **Branch per Issue**: Branch names follow `issue-{N}-{slug}` pattern
3. **PR-Based Closure**: Issues are closed via PR merge with "Closes #N"

## Workflow

### 1. Create Issue

```bash
# Create a new issue
gh issue create --title "Implement Imposter gameplay loop" --body "Description..."

# Or with labels
gh issue create \
  --title "Implement Imposter gameplay loop" \
  --body "Description..." \
  --label "feature" --label "game-imposter"
```

### 2. Create Branch

```bash
# Get issue number from creation output, then:
git checkout -b issue-{N}-{slug}

# Example:
git checkout -b issue-5-imposter-gameplay
```

### 3. Make Changes

```bash
# Stage changes
git add .

# Commit with conventional commit format
git commit -m "feat: implement imposter role assignment loop

- Added role assignment flow with PassScreen + PrivacyReveal
- Integrated category picker and word selection
- Added discussion timer phase"
```

### 4. Push and Create PR

```bash
# Push branch
git push -u origin issue-5-imposter-gameplay

# Create PR
gh pr create \
  --title "feat: implement imposter gameplay loop" \
  --body "## Summary
- Implemented full Imposter gameplay flow

## Test plan
- [ ] Test role assignment with 3-20 players
- [ ] Test privacy reveal mechanic
- [ ] Test voting and results

Closes #5"
```

### 5. Review and Merge

```bash
# View PR status
gh pr status

# Merge PR (closes the issue)
gh pr merge --squash
```

## Issue Labels

| Label | Purpose |
|-------|---------|
| `bug` | Something isn't working |
| `feature` | New functionality |
| `enhancement` | Improvements to existing features |
| `game-imposter` | Imposter game work |
| `game-hot-takes` | Hot Takes game work |
| `game-truth-or-dare` | Truth or Dare game work |
| `ui` | UI/UX changes |
| `data` | Game content / word data |
| `pwa` | PWA / offline features |

## Branch Naming

Pattern: `issue-{number}-{slug}`

Examples:
- `issue-5-imposter-gameplay`
- `issue-8-hot-takes-prompts`
- `issue-12-fix-privacy-reveal`

## Commit Messages

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance
- `data:` - Game content data

Examples:
```
feat: implement imposter voting phase
fix: prevent accidental role reveal on pass screen
data: add animals and food category words
refactor: extract game phase machine from store
chore: update dependencies
```

## Pre-Work Checklist

Before making any changes:

1. [ ] Issue exists for the work
2. [ ] On correct branch (`git branch --show-current`)
3. [ ] Branch up to date (`git pull origin main`)
4. [ ] Not on `main` branch

## NEVER

- Make changes on `main` branch
- Close issues manually
- Skip PR review
- Push directly to `main`
- Create commits without an associated issue
