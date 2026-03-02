# Sussy

Mobile-first party game PWA — "One phone. All the games."

## Core Workflow

1. **No Task, No Work**: Must be working on a branch (`issue-{number}-{slug}`) associated with a GitHub issue. Task is completed when PR is merged (reference with "Closes #N").

## Pre-Work Checklist (MANDATORY)

**Before ANY code/file changes, verify:**

1. **Issue exists?** → If not, create one first with `gh issue create`
2. **On correct branch?** → Run `git branch --show-current`
   - If on `main`, STOP and create branch: `git checkout -b issue-{N}-{slug}`
   - Branch name MUST match pattern `issue-{number}-{description}`
3. **Branch up to date?** → `git pull origin main` before starting

**Before closing ANY issue:**

1. **PR created?** → Issues are closed via PR merge with "Closes #N", never manually
2. **PR reviewed and merged?** → Wait for human approval

**NEVER:**
- Make file changes while on `main` branch
- Close issues manually (let PR merge close them)
- Skip the PR review cycle

---

## Common Commands
```bash
# Development
npm run dev                    # Start Next.js dev server (http://localhost:3000)
npm run build                  # Production build
npm run lint                   # Run ESLint

# Testing
npm run build                  # Type-check via build (no test runner yet)
```

---

## Tech Stack

**Framework:** Next.js (App Router) + TypeScript
**Styling:** Tailwind CSS v4
**Animations:** Framer Motion
**State:** Zustand (with localStorage persistence)
**PWA:** @ducanh2912/next-pwa
**Haptics:** Web Vibration API (lib/haptics.ts)

No backend — all game data is local JSON. Single-device pass-and-play.

---

## Project Structure

```
sussy/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout, fonts, metadata
│   │   ├── page.tsx            # Home screen — game selector
│   │   ├── globals.css         # Theme variables, Tailwind
│   │   ├── imposter/           # Imposter game
│   │   │   ├── page.tsx        # Setup screen
│   │   │   └── play/page.tsx   # Gameplay loop
│   │   ├── hot-takes/          # Hot Takes game
│   │   │   ├── page.tsx        # Setup screen
│   │   │   └── play/page.tsx   # Gameplay loop
│   │   └── truth-or-dare/      # Truth or Dare game
│   │       ├── page.tsx        # Setup screen
│   │       └── play/page.tsx   # Gameplay loop
│   ├── components/
│   │   ├── ui/                 # Primitives: Button, Card, Modal, Slider, Badge
│   │   ├── game/               # Shared game components
│   │   │   ├── PlayerSetup.tsx
│   │   │   ├── PassScreen.tsx
│   │   │   ├── PrivacyReveal.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── VotingScreen.tsx
│   │   │   ├── ResultsScreen.tsx
│   │   │   └── Scoreboard.tsx
│   │   └── layout/             # GameShell, HomeHeader
│   ├── data/                   # Game content JSON (imposter/, hot-takes/, truth-or-dare/)
│   ├── lib/
│   │   ├── store.ts            # Zustand store (all game states)
│   │   ├── gameEngine.ts       # Role assignment, vote tallying, word picking
│   │   ├── haptics.ts          # Vibration API wrappers
│   │   └── utils.ts            # Shuffle, random pick, cn()
│   └── hooks/
│       ├── useGameState.ts     # Game state helpers
│       ├── useTimer.ts         # Countdown with pause/resume
│       └── useWakeLock.ts      # Prevent screen sleep
├── public/
│   └── manifest.json           # PWA manifest
├── next.config.ts              # PWA + Next.js config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Design System

```
Background:     #0A0A1A (deep dark) → #111127 (subtle gradient)
Surfaces:       #1A1A2E (cards)
Text primary:   #FFFFFF
Text secondary: #9CA3AF
Text muted:     #6B7280

Game accents:
  Imposter:       #8B5CF6 (purple)
  Hot Takes:      #F59E0B (amber)
  Truth or Dare:  #06B6D4 (cyan)

Status:
  Success: #10B981  Danger: #EF4444  Warning: #F59E0B
```

All buttons min 48px tap target. Min font 18px for game content. Dark mode only.

---

## Game Modes

| Game | Players | Accent | Status |
|------|---------|--------|--------|
| The Imposter 🕵️ | 3-20 | Purple | Phase 1 scaffold done |
| Hot Takes 🔥 | 3-15 | Amber | Phase 1 scaffold done |
| Truth or Dare 😈 | 2-20 | Cyan | Phase 1 scaffold done |

---

## Build Phases

1. **Foundation** — Project setup, design system, home screen, shared components ✅
2. **The Imposter** — Full game: setup → role assignment → discussion → voting → results
3. **Hot Takes** — Full game: setup → prompts → voting → recap
4. **Truth or Dare** — Full game: setup → truth/dare selection → prompts → stats
5. **Polish & PWA** — Animations, haptics, offline, meta tags, deploy

---

## Critical Implementation Notes

1. **Privacy is everything** — PrivacyReveal must be airtight (tap to show, tap to hide, auto-hide after 5s, vibrate on reveal)
2. **Screen wake lock** — Use Wake Lock API during gameplay
3. **No loading states** — All data is local JSON, everything instant
4. **Large tap targets** — Min 48x48px, people are passing phones around
5. **Use `dvh`** — Dynamic viewport height for mobile browser chrome
6. **Edge cases** — Cap imposters at (players - 2), reshuffle when prompts exhausted

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| PWA not updating | Clear service worker cache, hard refresh |
| Viewport height wrong on mobile | Use `dvh` instead of `vh` |
| Framer Motion hydration mismatch | Wrap animated components in client boundary |
| Zustand persist not working | Check localStorage key, ensure client-side only |
