"use client";

import { useGameStore } from "@/lib/store";

export function useGameState() {
  const store = useGameStore();

  const createPlayers = (count: number, names?: string[]) => {
    const players = Array.from({ length: count }, (_, i) => ({
      id: i,
      name: names?.[i] || `Player ${i + 1}`,
      score: 0,
    }));
    store.setPlayers(players);
    return players;
  };

  const nextPlayer = () => {
    const game = store.currentGame;
    if (game === "imposter") {
      store.updateImposterState({
        currentPlayerIndex: store.imposterState.currentPlayerIndex + 1,
      });
    } else if (game === "truth-or-dare") {
      const next =
        (store.truthOrDareState.currentPlayerIndex + 1) % store.players.length;
      store.updateTruthOrDareState({ currentPlayerIndex: next });
    }
  };

  return {
    ...store,
    createPlayers,
    nextPlayer,
  };
}
