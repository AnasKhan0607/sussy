---
name: doc-check
description: Documentation check before commits. Analyzes staged changes and proposes updates to CLAUDE.md, skills, docs, or migrations. Run before committing significant changes.
user_invocable: true
---

# Documentation Check

Analyzes all code changes on the current branch, determines if documentation updates are needed, makes targeted updates, and stages them.

## Procedure

When invoked, follow these steps in order:

### Step 1: Identify changed files

```bash
# Determine base branch
BASE=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD origin/master 2>/dev/null || git merge-base HEAD main 2>/dev/null || git merge-base HEAD master)

# List all files changed on this branch
git diff --name-only "$BASE"...HEAD
```

### Step 2: Read the actual diffs

Read the diffs to understand what changed semantically — not just which files were touched:

```bash
git diff "$BASE"...HEAD
```

For large diffs, focus on structural changes: new components, new game data, new hooks, changed store schema, new routes.

### Step 3: Read current documentation

Read `CLAUDE.md` and any skill files that might be affected by the changes.

### Step 4: Apply the usefulness filter

**DO update documentation when:**
- A new game mode or game phase was implemented
- New shared components were added or existing ones changed their API
- The Zustand store schema changed
- New hooks or utilities were added
- New game data format or categories were introduced
- A workflow or architecture changed in a way that would confuse someone following the current docs
- A new skill would save significant future context

**DO NOT update documentation when:**
- A bug fix that doesn't change any patterns or architecture
- UI-only changes (styling, layout, copy)
- Adding game content data that follows the existing JSON format
- Refactors that don't change component APIs or developer workflow
- Changes that would make docs longer without making them more useful

**For skills specifically:**
- Only create a new skill if a genuinely new technology or complex pattern was introduced that will be reused
- Only update an existing skill if a pattern changed or a new gotcha was discovered
- Never add content to a skill just because a file in that domain was touched

### Step 5: Make updates or confirm none needed

If updates are warranted:
1. Edit the relevant doc files with targeted, concise changes
2. Stage the changes: `git add CLAUDE.md .claude/skills/ docs/` (only files that changed)
3. Summarize what was updated and why

If no updates are needed:
1. Explain briefly why the changes don't warrant doc updates
2. Create a `.doc-check-passed` marker file so the pre-PR hook knows the check ran:
   ```bash
   git diff --name-only "$BASE"...HEAD > .doc-check-passed
   git add .doc-check-passed
   ```

Either outcome unblocks the pre-PR hook (doc files or marker file will appear in the changeset).

## Examples

### Example: New game mode implemented

Changes: `src/app/imposter/page.tsx`, `src/app/imposter/play/page.tsx`, `src/data/imposter/*.json`, `src/lib/store.ts`

Updates needed:
- Update game mode status in CLAUDE.md (mark Imposter as complete)
- Document any new store actions or state shape changes
- Note any new patterns introduced

### Example: Bug fix in privacy reveal

Changes: Fixed auto-hide timing in `src/components/game/PrivacyReveal.tsx`

No updates needed — the fix doesn't change any documented pattern. Confirm and move on.

### Example: Added new game data categories

Changes: Added `src/data/imposter/sports.json`, `src/data/imposter/music.json`

No updates needed — follows existing JSON format already documented.
