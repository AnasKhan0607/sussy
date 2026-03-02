---
name: sussy-feature
description: End-to-end game feature implementation for Sussy. Orchestrates creating game pages, components, data files, and store updates. Use when implementing new game modes, adding gameplay phases, or building new features.
---

# Sussy Feature Implementation

This skill guides end-to-end feature implementation for the Sussy party game app.

## When to Use

- Implementing a new game mode (e.g., "build the Imposter game")
- Adding a gameplay phase (e.g., "add voting to Hot Takes")
- Creating new game data (e.g., "add word categories")
- Building new shared game components

## Architecture Overview

```
src/
├── app/{game}/            # Setup page (page.tsx) + gameplay (/play/page.tsx)
├── components/game/       # Shared game components (PassScreen, VotingScreen, etc.)
├── components/ui/         # Primitives (Button, Card, Modal, etc.)
├── data/{game}/           # Game content JSON files
├── lib/store.ts           # Zustand store (all game states)
├── lib/gameEngine.ts      # Game logic utilities
└── hooks/                 # Shared hooks (timer, wake lock, game state)
```

## Implementation Workflow

### Phase 1: Game Data

Create JSON files in `src/data/{game}/` following the established format.

**Imposter words:**
```json
{
  "category": "Animals",
  "emoji": "🐾",
  "words": {
    "easy": ["Dog", "Cat", "Fish"],
    "medium": ["Elephant", "Giraffe", "Penguin"],
    "hard": ["Platypus", "Axolotl", "Narwhal"]
  }
}
```

**Hot Takes prompts:**
```json
{
  "pack": "Clean",
  "prompts": [
    "fall asleep first at a sleepover",
    "survive a zombie apocalypse"
  ]
}
```

**Truth or Dare:**
```json
{
  "intensity": "standard",
  "truths": ["What's the most embarrassing thing you've done?"],
  "dares": ["Do your best impression of someone in this room"]
}
```

### Phase 2: Store Updates

Update `src/lib/store.ts` with any new state fields or actions needed for the game phase.

```typescript
// Add to the appropriate game state slice
imposterState: {
  phase: 'setup' | 'assigning' | 'discussion' | 'voting' | 'results';
  // ... add new fields as needed
};
```

### Phase 3: Setup Page

Build the game setup screen at `src/app/{game}/page.tsx`:

```typescript
'use client';

import { GameShell } from '@/components/layout/GameShell';
import { PlayerSetup } from '@/components/game/PlayerSetup';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/lib/store';

export default function GameSetupPage() {
  // Setup UI: player count, game-specific options, "Start Game" button
  // Navigate to /game/play on start
}
```

### Phase 4: Gameplay Page

Build the gameplay loop at `src/app/{game}/play/page.tsx`:

```typescript
'use client';

import { GameShell } from '@/components/layout/GameShell';
import { PassScreen } from '@/components/game/PassScreen';
import { PrivacyReveal } from '@/components/game/PrivacyReveal';
import { VotingScreen } from '@/components/game/VotingScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { useGameStore } from '@/lib/store';

export default function GamePlayPage() {
  const { phase } = useGameStore(s => s.gameState);

  // Render different component based on current phase
  switch (phase) {
    case 'assigning': return <PassScreen />;
    case 'discussion': return <DiscussionPhase />;
    case 'voting': return <VotingScreen />;
    case 'results': return <ResultsScreen />;
  }
}
```

### Phase 5: Game-Specific Components

If the game needs components beyond the shared ones, create them alongside the page or in `components/game/`.

## Key Patterns

### State Management
- All game state lives in Zustand store (`lib/store.ts`)
- Use `phase` field to drive which component renders
- Persist settings (not mid-game state) via Zustand persist middleware

### Privacy-First Design
- Always use PassScreen between players
- PrivacyReveal for any secret content
- Auto-hide after 5 seconds
- Vibrate on reveal

### Navigation
- Setup page → `/game/play` on game start
- Results → "Play Again" (same settings), "New Game" (back to setup), "Home" (/)

### Responsive
- All tap targets min 48px
- Use `dvh` for viewport height
- Test on small screens (iPhone SE) through large (Pro Max)

## Game Flow Templates

### Pass-and-Play Game (Imposter, Truth or Dare)
```
Setup → [for each player: PassScreen → Action → Hide] → Group Phase → Results
```

### Group Game (Hot Takes)
```
Setup → [for each round: Show Prompt → Vote/Discuss → Show Result] → Final Recap
```

## Related Files

| Purpose | File |
|---------|------|
| Store | `src/lib/store.ts` |
| Game engine | `src/lib/gameEngine.ts` |
| Haptics | `src/lib/haptics.ts` |
| Shared components | `src/components/game/*.tsx` |
| UI primitives | `src/components/ui/*.tsx` |
