#!/usr/bin/env bash
# Pre-PR documentation check hook
# Blocks `gh pr create` when significant code changes exist without doc updates.
# Exit codes: 0 = allow, 2 = block with message

set -euo pipefail

# Read tool input from stdin
INPUT=$(cat)

# Extract the command from JSON tool input
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

# Only gate `gh pr create` commands
if ! echo "$COMMAND" | grep -q "gh pr create"; then
  exit 0
fi

# Determine base branch
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  BASE="origin/main"
elif git rev-parse --verify origin/master >/dev/null 2>&1; then
  BASE="origin/master"
elif git rev-parse --verify main >/dev/null 2>&1; then
  BASE="main"
elif git rev-parse --verify master >/dev/null 2>&1; then
  BASE="master"
else
  # Can't determine base branch — allow
  exit 0
fi

# Get merge base to only look at branch changes
MERGE_BASE=$(git merge-base HEAD "$BASE" 2>/dev/null || echo "")
if [ -z "$MERGE_BASE" ]; then
  exit 0
fi

# Get files changed on this branch
CHANGED_FILES=$(git diff --name-only "$MERGE_BASE"...HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

# Check for significant code changes (files likely to need doc updates)
HAS_SIGNIFICANT=false

while IFS= read -r file; do
  # Skip test files
  if echo "$file" | grep -qE '\.(test|spec)\.(ts|tsx|js|jsx)$'; then
    continue
  fi
  # Skip CSS/style-only files
  if echo "$file" | grep -qE '\.(css|scss|less)$'; then
    continue
  fi
  # Skip UI-only component files (components/ui/)
  if echo "$file" | grep -qE 'components/ui/'; then
    continue
  fi

  # App router pages (new routes/games)
  if echo "$file" | grep -qE 'src/app/.*\.(ts|tsx)$'; then
    HAS_SIGNIFICANT=true
    break
  fi
  # Game components
  if echo "$file" | grep -qE 'src/components/game/.*\.(ts|tsx)$'; then
    HAS_SIGNIFICANT=true
    break
  fi
  # Library files (store, engine, utils)
  if echo "$file" | grep -qE 'src/lib/.*\.ts$'; then
    HAS_SIGNIFICANT=true
    break
  fi
  # Hooks
  if echo "$file" | grep -qE 'src/hooks/.*\.ts$'; then
    HAS_SIGNIFICANT=true
    break
  fi
  # Game data files
  if echo "$file" | grep -qE 'src/data/.*\.json$'; then
    HAS_SIGNIFICANT=true
    break
  fi
  # Config files
  if echo "$file" | grep -qE 'next\.config\.(ts|js)$'; then
    HAS_SIGNIFICANT=true
    break
  fi
  # New dependencies
  if echo "$file" | grep -qE 'package\.json$'; then
    HAS_SIGNIFICANT=true
    break
  fi
  # PWA manifest
  if echo "$file" | grep -qE 'public/manifest\.json$'; then
    HAS_SIGNIFICANT=true
    break
  fi
done <<< "$CHANGED_FILES"

if [ "$HAS_SIGNIFICANT" = false ]; then
  exit 0
fi

# Check if any documentation files were updated (committed on branch OR staged)
HAS_DOC_UPDATE=false

# Check committed changes on the branch
while IFS= read -r file; do
  if echo "$file" | grep -qE '^CLAUDE\.md$'; then
    HAS_DOC_UPDATE=true
    break
  fi
  if echo "$file" | grep -qE '\.claude/skills/'; then
    HAS_DOC_UPDATE=true
    break
  fi
  if echo "$file" | grep -qE '\.claude/hooks/'; then
    HAS_DOC_UPDATE=true
    break
  fi
  if echo "$file" | grep -qE '^docs/'; then
    HAS_DOC_UPDATE=true
    break
  fi
  if echo "$file" | grep -qE '^\.doc-check-passed$'; then
    HAS_DOC_UPDATE=true
    break
  fi
done <<< "$CHANGED_FILES"

# Also check staged files (for doc changes not yet committed)
if [ "$HAS_DOC_UPDATE" = false ]; then
  STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if echo "$file" | grep -qE '^CLAUDE\.md$|\.claude/skills/|\.claude/hooks/|^docs/|^\.doc-check-passed$'; then
      HAS_DOC_UPDATE=true
      break
    fi
  done <<< "$STAGED_FILES"
fi

if [ "$HAS_DOC_UPDATE" = true ]; then
  exit 0
fi

# Block — significant code changes without doc updates
echo "BLOCKED: Significant code changes detected without documentation review."
echo "Run /doc-check to verify if CLAUDE.md or skills need updating."
echo "(If no updates are needed, /doc-check will confirm that and you can proceed.)"
exit 2
