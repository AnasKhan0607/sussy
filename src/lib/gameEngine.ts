import { Player } from "./store";
import { shuffle, pickRandom } from "./utils";

export interface WordEntry {
  word: string;
  hint: string;
}

export interface CategoryData {
  category: string;
  emoji: string;
  words: {
    easy: WordEntry[];
    medium: WordEntry[];
    hard: WordEntry[];
  };
}

export function assignImposterRoles(
  playerCount: number,
  imposterCount: number
): number[] {
  const capped = Math.min(imposterCount, playerCount - 2);
  const indices = Array.from({ length: playerCount }, (_, i) => i);
  return shuffle(indices).slice(0, capped);
}

export function pickWord(
  categoryData: CategoryData,
  difficulty: "easy" | "medium" | "hard" | "mixed"
): WordEntry {
  if (difficulty === "mixed") {
    const allWords = [
      ...categoryData.words.easy,
      ...categoryData.words.medium,
      ...categoryData.words.hard,
    ];
    return pickRandom(allWords);
  }
  return pickRandom(categoryData.words[difficulty]);
}

export function tallyVotes(
  votes: Record<number, number>,
  players: Player[]
): { votedOutId: number; voteCounts: Record<number, number>; isTie: boolean } {
  const counts: Record<number, number> = {};
  players.forEach((p) => (counts[p.id] = 0));

  Object.values(votes).forEach((votedForId) => {
    counts[votedForId] = (counts[votedForId] || 0) + 1;
  });

  const maxVotes = Math.max(...Object.values(counts));
  const topPlayers = Object.entries(counts)
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => Number(id));

  return {
    votedOutId: topPlayers[0],
    voteCounts: counts,
    isTie: topPlayers.length > 1,
  };
}

export function rollChaosRound(): boolean {
  return Math.random() < 1 / 15;
}

export function pickOddOneOut(playerCount: number): number {
  return Math.floor(Math.random() * playerCount);
}

export function checkImposterWin(
  votedOutId: number,
  imposterIndices: number[],
  players: Player[]
): boolean {
  const votedOutPlayerIndex = players.findIndex((p) => p.id === votedOutId);
  return !imposterIndices.includes(votedOutPlayerIndex);
}
