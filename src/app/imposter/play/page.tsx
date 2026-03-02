"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GameShell } from "@/components/layout/GameShell";
import { PassScreen } from "@/components/game/PassScreen";
import { PrivacyReveal } from "@/components/game/PrivacyReveal";
import { useGameStore } from "@/lib/store";

const ACCENT = "#8B5CF6";

type PlayPhase = "pass" | "reveal";

export default function ImposterPlay() {
  const router = useRouter();
  const { players, imposterState, updateImposterState } = useGameStore();
  const { phase, currentPlayerIndex, imposterIndices, secretWord, category } =
    imposterState;

  // If no players or still in setup, redirect back
  if (players.length === 0 || phase === "setup") {
    return (
      <GameShell title="The Imposter" accentColor={ACCENT}>
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg mb-4">
            No game in progress
          </p>
          <button
            onClick={() => router.push("/imposter")}
            className="underline cursor-pointer"
            style={{ color: ACCENT }}
          >
            Go to setup
          </button>
        </div>
      </GameShell>
    );
  }

  // Assigning phase — pass-and-reveal loop
  if (phase === "assigning") {
    return (
      <AssigningPhase
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        imposterIndices={imposterIndices}
        secretWord={secretWord}
        category={category}
        onAdvance={(nextIndex) => {
          if (nextIndex >= players.length) {
            // All players have seen their roles — move to discussion
            updateImposterState({
              phase: "discussion",
              currentPlayerIndex: 0,
            });
          } else {
            updateImposterState({ currentPlayerIndex: nextIndex });
          }
        }}
      />
    );
  }

  // Discussion, voting, results phases — placeholder for future issues
  return (
    <GameShell title="The Imposter" accentColor={ACCENT}>
      <div className="text-center py-12">
        <p className="text-text-secondary text-lg">
          {phase === "discussion" && "Discussion phase coming next..."}
          {phase === "voting" && "Voting phase coming next..."}
          {phase === "results" && "Results phase coming next..."}
        </p>
      </div>
    </GameShell>
  );
}

function AssigningPhase({
  players,
  currentPlayerIndex,
  imposterIndices,
  secretWord,
  category,
  onAdvance,
}: {
  players: { id: number; name: string }[];
  currentPlayerIndex: number;
  imposterIndices: number[];
  secretWord: string;
  category: string;
  onAdvance: (nextIndex: number) => void;
}) {
  const currentPlayer = players[currentPlayerIndex];
  const isImposter = imposterIndices.includes(currentPlayerIndex);

  // Local sub-phase: "pass" or "reveal"
  const { subPhase, setSubPhase } = useSubPhase();

  const handleReady = useCallback(() => {
    setSubPhase("reveal");
  }, [setSubPhase]);

  const handleDone = useCallback(() => {
    setSubPhase("pass");
    onAdvance(currentPlayerIndex + 1);
  }, [setSubPhase, onAdvance, currentPlayerIndex]);

  const roleContent = isImposter ? (
    <div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-6xl mb-6"
      >
        🕵️
      </motion.div>
      <h2 className="text-3xl font-black text-danger mb-4 uppercase tracking-wider">
        You are the Imposter!
      </h2>
      <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4 mt-4 inline-block">
        <p className="text-text-muted text-sm mb-1">Category</p>
        <p className="text-xl font-bold text-text-primary">{category}</p>
      </div>
      <p className="text-text-muted text-sm mt-4">
        Blend in. Don&apos;t get caught.
      </p>
    </div>
  ) : (
    <div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-6xl mb-6"
      >
        ✅
      </motion.div>
      <h2 className="text-2xl font-bold text-success mb-6">You are safe!</h2>
      <div className="bg-surface border border-border rounded-[var(--radius-card)] p-5 mt-2">
        <p className="text-text-muted text-sm mb-1">Category</p>
        <p className="text-lg font-semibold text-text-secondary mb-3">
          {category}
        </p>
        <p className="text-text-muted text-sm mb-1">Secret Word</p>
        <p className="text-3xl font-black" style={{ color: ACCENT }}>
          {secretWord}
        </p>
      </div>
      <p className="text-text-muted text-sm mt-4">
        Find the imposter!
      </p>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {subPhase === "pass" ? (
        <PassScreen
          key={`pass-${currentPlayerIndex}`}
          playerName={currentPlayer.name}
          onReady={handleReady}
          accentColor={ACCENT}
        />
      ) : (
        <PrivacyReveal
          key={`reveal-${currentPlayerIndex}`}
          content={roleContent}
          autoHideDelay={8}
          onDone={handleDone}
          accentColor={ACCENT}
        />
      )}
    </AnimatePresence>
  );
}

function useSubPhase() {
  const [subPhase, setSubPhase] = useState<PlayPhase>("pass");
  return { subPhase, setSubPhase };
}

