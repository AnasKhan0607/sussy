# SUSSY

**One phone. All the games.**

Sussy is a mobile-first party game app where one phone gets passed around the group. No Wi-Fi, no second devices, no accounts needed. Just open the link and play.

## Games

### The Imposter
The viral TikTok word game. Everyone gets shown the same secret word — except the imposter, who has to fake it. Take turns giving one-word clues, then vote on who you think is faking it.

- 3–20 players
- 12 categories with easy/medium/hard words
- Configurable imposter count and discussion timer

### Hot Takes (Most Likely To)
"Most likely to..." prompts that get the group pointing fingers. Vote secretly or just shout it out.

- 3–15 players
- 3 prompt packs: Clean, Friend Group, Spicy
- Open mode (shout) or secret voting mode

### Spin & Guess
The viral TikTok number guessing game. A spinner lands on a number (1–10). One player is the guesser and can't see it. Their friends each get a category and scale (like "Basketball players — best to worst") and give a one-word clue to help the guesser figure out the number.

- 3–10 players
- The guesser assigns categories to friends based on who they think would give the best clue
- 1 free custom category the guesser makes up themselves
- Multiple scale types: 1–10, most likely to least likely, best to worst, and more

## Tech Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** v4 for styling
- **Framer Motion** for animations
- **Zustand** for state management (localStorage persistence)
- **PWA** — installable, works offline, no app store needed

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or browser.

## Project Structure

```
src/
├── app/                  # Pages (home, game setup, gameplay)
│   ├── imposter/         # The Imposter game
│   ├── hot-takes/        # Hot Takes game
│   └── spin-and-guess/   # Spin & Guess game
├── components/
│   ├── ui/               # Button, Card, Modal, Slider, Badge
│   ├── game/             # Shared game components
│   └── layout/           # Game shell, header
├── data/                 # Game content (words, prompts, categories)
├── lib/                  # Store, game engine, utils, haptics
└── hooks/                # Timer, wake lock, game state
```

## License

MIT
