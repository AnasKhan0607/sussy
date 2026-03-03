"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Player {
  id: number;
  name: string;
  score: number;
}

export interface ImposterState {
  category: string;
  secretWord: string;
  secretHint: string;
  imposterIndices: number[];
  currentPlayerIndex: number;
  phase: "setup" | "assigning" | "discussion" | "voting" | "reveal" | "results";
  votes: Record<number, number>;
  timerDuration: number | null;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  imposterCount: number;
  enableTimer: boolean;
  enableVoting: boolean;
  showCategoryToImposter: boolean;
  showHintToImposter: boolean;
}

export interface HotTakesState {
  pack: string;
  currentPromptIndex: number;
  prompts: string[];
  votingMode: "open" | "secret";
  votes: Record<number, number>;
  results: Array<{ prompt: string; winnerId: number }>;
  phase: "setup" | "prompt" | "voting" | "result" | "end";
}

export interface SpinAndGuessAssignment {
  playerIndex: number;
  categoryId: string;
  scaleId: string;
}

export interface SpinAndGuessRound {
  guesserIndex: number;
  secretNumber: number;
  guess: number;
  clues: Record<number, string>;
  score: number;
}

export interface SpinAndGuessState {
  phase:
    | "setup"
    | "assign-categories"
    | "spinning"
    | "clues"
    | "guessing"
    | "reveal"
    | "end";
  guesserIndex: number;
  totalRounds: number;
  roundNumber: number;
  secretNumber: number | null;
  assignments: SpinAndGuessAssignment[];
  customCategory: {
    label: string;
    scaleId: string;
    playerIndex: number;
  } | null;
  clues: Record<number, string>;
  guess: number | null;
  currentClueIndex: number;
  scores: Record<number, number>;
  roundHistory: SpinAndGuessRound[];
}

interface GameStore {
  // Global
  players: Player[];
  currentGame: "imposter" | "hot-takes" | "spin-and-guess" | null;

  // Game states
  imposterState: ImposterState;
  hotTakesState: HotTakesState;
  spinAndGuessState: SpinAndGuessState;

  // Actions
  setPlayers: (players: Player[]) => void;
  setCurrentGame: (game: GameStore["currentGame"]) => void;
  updateImposterState: (state: Partial<ImposterState>) => void;
  updateHotTakesState: (state: Partial<HotTakesState>) => void;
  updateSpinAndGuessState: (state: Partial<SpinAndGuessState>) => void;
  resetGame: () => void;
}

const defaultImposterState: ImposterState = {
  category: "",
  secretWord: "",
  secretHint: "",
  imposterIndices: [],
  currentPlayerIndex: 0,
  phase: "setup",
  votes: {},
  timerDuration: 120,
  difficulty: "mixed",
  imposterCount: 1,
  enableTimer: false,
  enableVoting: false,
  showCategoryToImposter: true,
  showHintToImposter: false,
};

const defaultHotTakesState: HotTakesState = {
  pack: "clean",
  currentPromptIndex: 0,
  prompts: [],
  votingMode: "open",
  votes: {},
  results: [],
  phase: "setup",
};

const defaultSpinAndGuessState: SpinAndGuessState = {
  phase: "setup",
  guesserIndex: 0,
  totalRounds: 0,
  roundNumber: 0,
  secretNumber: null,
  assignments: [],
  customCategory: null,
  clues: {},
  guess: null,
  currentClueIndex: 0,
  scores: {},
  roundHistory: [],
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      players: [],
      currentGame: null,
      imposterState: { ...defaultImposterState },
      hotTakesState: { ...defaultHotTakesState },
      spinAndGuessState: { ...defaultSpinAndGuessState },

      setPlayers: (players) => set({ players }),
      setCurrentGame: (currentGame) => set({ currentGame }),

      updateImposterState: (state) =>
        set((prev) => ({
          imposterState: { ...prev.imposterState, ...state },
        })),

      updateHotTakesState: (state) =>
        set((prev) => ({
          hotTakesState: { ...prev.hotTakesState, ...state },
        })),

      updateSpinAndGuessState: (state) =>
        set((prev) => ({
          spinAndGuessState: { ...prev.spinAndGuessState, ...state },
        })),

      resetGame: () =>
        set({
          currentGame: null,
          imposterState: { ...defaultImposterState },
          hotTakesState: { ...defaultHotTakesState },
          spinAndGuessState: { ...defaultSpinAndGuessState },
        }),
    }),
    {
      name: "sussy-settings",
      partialize: (state) => ({
        // Only persist settings, not game state
        imposterState: {
          timerDuration: state.imposterState.timerDuration,
          difficulty: state.imposterState.difficulty,
          imposterCount: state.imposterState.imposterCount,
          enableTimer: state.imposterState.enableTimer,
          enableVoting: state.imposterState.enableVoting,
          showCategoryToImposter: state.imposterState.showCategoryToImposter,
          showHintToImposter: state.imposterState.showHintToImposter,
        },
        hotTakesState: {
          pack: state.hotTakesState.pack,
          votingMode: state.hotTakesState.votingMode,
        },
        spinAndGuessState: {
          totalRounds: state.spinAndGuessState.totalRounds,
        },
      }),
    }
  )
);
