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
  isChaosRound: boolean;
}

export interface OddOneOutState {
  category: string;
  currentRound: number;
  totalRounds: number;
  oddOneOutPlayerIndex: number | null;
  currentNormalQuestion: string;
  currentOddQuestion: string;
  currentPlayerIndex: number;
  phase: "setup" | "assigning" | "discussion" | "voting" | "reveal" | "end";
  votes: Record<number, number>;
  enableTimer: boolean;
  enableVoting: boolean;
  timerDuration: number | null;
  scores: Record<number, number>;
  results: Array<{
    round: number;
    oddOneOutIndex: number;
    votedOutId: number;
    wasCorrect: boolean;
  }>;
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
  currentGame: "imposter" | "odd-one-out" | "spin-and-guess" | null;

  // Game states
  imposterState: ImposterState;
  oddOneOutState: OddOneOutState;
  spinAndGuessState: SpinAndGuessState;

  // Actions
  setPlayers: (players: Player[]) => void;
  setCurrentGame: (game: GameStore["currentGame"]) => void;
  updateImposterState: (state: Partial<ImposterState>) => void;
  updateOddOneOutState: (state: Partial<OddOneOutState>) => void;
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
  isChaosRound: false,
};

const defaultOddOneOutState: OddOneOutState = {
  category: "",
  currentRound: 0,
  totalRounds: 5,
  oddOneOutPlayerIndex: null,
  currentNormalQuestion: "",
  currentOddQuestion: "",
  currentPlayerIndex: 0,
  phase: "setup",
  votes: {},
  enableTimer: false,
  enableVoting: false,
  timerDuration: 120,
  scores: {},
  results: [],
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
      oddOneOutState: { ...defaultOddOneOutState },
      spinAndGuessState: { ...defaultSpinAndGuessState },

      setPlayers: (players) => set({ players }),
      setCurrentGame: (currentGame) => set({ currentGame }),

      updateImposterState: (state) =>
        set((prev) => ({
          imposterState: { ...prev.imposterState, ...state },
        })),

      updateOddOneOutState: (state) =>
        set((prev) => ({
          oddOneOutState: { ...prev.oddOneOutState, ...state },
        })),

      updateSpinAndGuessState: (state) =>
        set((prev) => ({
          spinAndGuessState: { ...prev.spinAndGuessState, ...state },
        })),

      resetGame: () =>
        set({
          currentGame: null,
          imposterState: { ...defaultImposterState },
          oddOneOutState: { ...defaultOddOneOutState },
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
        oddOneOutState: {
          category: state.oddOneOutState.category,
          enableTimer: state.oddOneOutState.enableTimer,
          enableVoting: state.oddOneOutState.enableVoting,
          timerDuration: state.oddOneOutState.timerDuration,
          totalRounds: state.oddOneOutState.totalRounds,
        },
        spinAndGuessState: {
          totalRounds: state.spinAndGuessState.totalRounds,
        },
      }),
    }
  )
);
