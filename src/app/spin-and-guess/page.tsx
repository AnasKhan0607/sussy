"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GameShell } from "@/components/layout/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGameStore, Player } from "@/lib/store";
import { cn } from "@/lib/utils";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

const ACCENT = "#06B6D4";
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;

const ROUND_OPTIONS = [
  { label: "Quick", value: "quick", description: "Everyone guesses once" },
  { label: "Standard", value: "standard", description: "Everyone guesses twice" },
  { label: "Marathon", value: "marathon", description: "Everyone guesses 3 times" },
];

export default function SpinAndGuessSetup() {
  const router = useRouter();
  const { setPlayers, setCurrentGame, updateSpinAndGuessState } = useGameStore();

  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState<string[]>([]);
  const [roundMode, setRoundMode] = useState("standard");
  const [guesserMode, setGuesserMode] = useState<"random" | "first">("random");

  const handlePlayerChange = (delta: number) => {
    setPlayerCount((prev) =>
      Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, prev + delta))
    );
  };

  const handleNameChange = (index: number, name: string) => {
    setNames((prev) => {
      const updated = [...prev];
      updated[index] = name;
      return updated;
    });
  };

  const getRoundCount = () => {
    switch (roundMode) {
      case "quick": return playerCount;
      case "standard": return playerCount * 2;
      case "marathon": return playerCount * 3;
      default: return playerCount;
    }
  };

  const handleStart = () => {
    const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: names[i]?.trim() || `Player ${i + 1}`,
      score: 0,
    }));

    const guesserIndex =
      guesserMode === "random"
        ? Math.floor(Math.random() * playerCount)
        : 0;

    const totalRounds = getRoundCount();
    const initialScores: Record<number, number> = {};
    players.forEach((p) => (initialScores[p.id] = 0));

    setPlayers(players);
    setCurrentGame("spin-and-guess");
    updateSpinAndGuessState({
      phase: "assign-categories",
      guesserIndex,
      totalRounds,
      roundNumber: 1,
      secretNumber: null,
      assignments: [],
      customCategory: null,
      clues: {},
      guess: null,
      currentClueIndex: 0,
      scores: initialScores,
      roundHistory: [],
    });

    router.push("/spin-and-guess/play");
  };

  // Need at least names entered
  const hasNames = Array.from({ length: playerCount }, (_, i) => names[i]?.trim()).some(Boolean);

  return (
    <GameShell title="Spin & Guess" accentColor={ACCENT}>
      <motion.div
        className="space-y-8 pb-4"
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="visible"
      >
        {/* Player count */}
        <motion.section variants={fadeSlideUp}>
          <h2 className="text-lg font-bold mb-3">Players</h2>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary">How many?</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePlayerChange(-1)}
                  disabled={playerCount <= MIN_PLAYERS}
                  className={cn(
                    "w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center cursor-pointer",
                    playerCount <= MIN_PLAYERS
                      ? "opacity-30"
                      : "hover:bg-surface-hover"
                  )}
                >
                  −
                </button>
                <motion.span
                  key={playerCount}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-bold min-w-[40px] text-center"
                  style={{ color: ACCENT }}
                >
                  {playerCount}
                </motion.span>
                <button
                  onClick={() => handlePlayerChange(1)}
                  disabled={playerCount >= MAX_PLAYERS}
                  className={cn(
                    "w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center cursor-pointer",
                    playerCount >= MAX_PLAYERS
                      ? "opacity-30"
                      : "hover:bg-surface-hover"
                  )}
                >
                  +
                </button>
              </div>
            </div>

            {/* Name inputs */}
            <div className="space-y-2">
              {Array.from({ length: playerCount }, (_, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={names[i] || ""}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-light text-sm"
                />
              ))}
            </div>
          </Card>
        </motion.section>

        {/* Rounds */}
        <motion.section variants={fadeSlideUp}>
          <h2 className="text-lg font-bold mb-3">Rounds</h2>
          <div className="space-y-2.5">
            {ROUND_OPTIONS.map((opt) => {
              const isSelected = roundMode === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRoundMode(opt.value)}
                  className={cn(
                    "w-full p-4 rounded-[var(--radius-card)] border text-left cursor-pointer transition-colors",
                    isSelected
                      ? "bg-[#06B6D420] border-[#06B6D4]"
                      : "bg-surface border-border hover:bg-surface-hover"
                  )}
                >
                  <span
                    className={cn(
                      "font-bold",
                      isSelected ? "text-white" : "text-text-secondary"
                    )}
                  >
                    {opt.label}
                  </span>
                  <span className="text-text-muted text-sm ml-2">
                    — {opt.description}
                  </span>
                </motion.button>
              );
            })}
          </div>
          <p className="text-text-muted text-xs mt-2">
            {getRoundCount()} rounds total · each player guesses{" "}
            {roundMode === "quick" ? "once" : roundMode === "standard" ? "twice" : "3 times"}
          </p>
        </motion.section>

        {/* First guesser */}
        <motion.section variants={fadeSlideUp}>
          <h2 className="text-lg font-bold mb-3">First Guesser</h2>
          <div className="flex gap-2.5">
            {(["random", "first"] as const).map((mode) => {
              const isSelected = guesserMode === mode;
              return (
                <motion.button
                  key={mode}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGuesserMode(mode)}
                  className={cn(
                    "flex-1 py-3 rounded-[var(--radius-button)] border font-semibold cursor-pointer transition-colors",
                    isSelected
                      ? "bg-[#06B6D420] border-[#06B6D4] text-white"
                      : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
                  )}
                >
                  {mode === "random" ? "Random" : "Player 1"}
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Start button */}
        <motion.div variants={fadeSlideUp}>
        <Button
          accentColor={ACCENT}
          fullWidth
          size="lg"
          onClick={handleStart}
        >
          🎯 Start Game
        </Button>
        </motion.div>
      </motion.div>
    </GameShell>
  );
}
