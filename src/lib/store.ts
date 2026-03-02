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
  imposterIndices: number[];
  currentPlayerIndex: number;
  phase: "setup" | "assigning" | "discussion" | "voting" | "results";
  votes: Record<number, number>;
  timerDuration: number | null;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  imposterCount: number;
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

export interface TruthOrDareState {
  intensity: string;
  currentPlayerIndex: number;
  phase: "setup" | "choosing" | "prompt" | "end";
  roundsPerPlayer: number;
  history: Array<{
    playerId: number;
    type: "truth" | "dare";
    prompt: string;
    completed: boolean;
  }>;
}

interface GameStore {
  // Global
  players: Player[];
  currentGame: "imposter" | "hot-takes" | "truth-or-dare" | null;

  // Game states
  imposterState: ImposterState;
  hotTakesState: HotTakesState;
  truthOrDareState: TruthOrDareState;

  // Actions
  setPlayers: (players: Player[]) => void;
  setCurrentGame: (game: GameStore["currentGame"]) => void;
  updateImposterState: (state: Partial<ImposterState>) => void;
  updateHotTakesState: (state: Partial<HotTakesState>) => void;
  updateTruthOrDareState: (state: Partial<TruthOrDareState>) => void;
  resetGame: () => void;
}

const defaultImposterState: ImposterState = {
  category: "",
  secretWord: "",
  imposterIndices: [],
  currentPlayerIndex: 0,
  phase: "setup",
  votes: {},
  timerDuration: 120,
  difficulty: "mixed",
  imposterCount: 1,
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

const defaultTruthOrDareState: TruthOrDareState = {
  intensity: "standard",
  currentPlayerIndex: 0,
  phase: "setup",
  roundsPerPlayer: 1,
  history: [],
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      players: [],
      currentGame: null,
      imposterState: { ...defaultImposterState },
      hotTakesState: { ...defaultHotTakesState },
      truthOrDareState: { ...defaultTruthOrDareState },

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

      updateTruthOrDareState: (state) =>
        set((prev) => ({
          truthOrDareState: { ...prev.truthOrDareState, ...state },
        })),

      resetGame: () =>
        set({
          currentGame: null,
          imposterState: { ...defaultImposterState },
          hotTakesState: { ...defaultHotTakesState },
          truthOrDareState: { ...defaultTruthOrDareState },
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
        },
        hotTakesState: {
          pack: state.hotTakesState.pack,
          votingMode: state.hotTakesState.votingMode,
        },
        truthOrDareState: {
          intensity: state.truthOrDareState.intensity,
          roundsPerPlayer: state.truthOrDareState.roundsPerPlayer,
        },
      }),
    }
  )
);
