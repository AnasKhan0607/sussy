"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GameShell } from "@/components/layout/GameShell";
import { PassScreen } from "@/components/game/PassScreen";
import { PrivacyReveal } from "@/components/game/PrivacyReveal";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useGameStore } from "@/lib/store";
import { useWakeLock } from "@/hooks/useWakeLock";
import { vibratePattern } from "@/lib/haptics";

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

  // Discussion phase
  if (phase === "discussion") {
    return (
      <DiscussionPhase
        category={category}
        timerDuration={imposterState.timerDuration}
        playerCount={players.length}
        imposterCount={imposterState.imposterCount}
        onEnd={() => updateImposterState({ phase: "voting" })}
      />
    );
  }

  // Voting, results phases — placeholder for future issues
  return (
    <GameShell title="The Imposter" accentColor={ACCENT}>
      <div className="text-center py-12">
        <p className="text-text-secondary text-lg">
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

function DiscussionPhase({
  category,
  timerDuration,
  playerCount,
  imposterCount,
  onEnd,
}: {
  category: string;
  timerDuration: number | null;
  playerCount: number;
  imposterCount: number;
  onEnd: () => void;
}) {
  useWakeLock(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  // Elapsed timer for "no limit" mode
  useEffect(() => {
    if (timerDuration !== null) return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerDuration]);

  const handleTimerComplete = useCallback(() => {
    vibratePattern();
    onEnd();
  }, [onEnd]);

  const handleEndEarly = () => {
    setShowEndModal(false);
    onEnd();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <GameShell title="The Imposter" accentColor={ACCENT}>
      <div className="flex flex-col items-center text-center gap-6 pt-4">
        {/* Category */}
        <div>
          <p className="text-text-muted text-sm mb-1">Category</p>
          <h2 className="text-2xl font-bold" style={{ color: ACCENT }}>
            {category}
          </h2>
        </div>

        {/* Timer */}
        <div className="py-4">
          {timerDuration !== null ? (
            <CountdownTimer
              duration={timerDuration}
              onComplete={handleTimerComplete}
              autoStart
              size={220}
            />
          ) : (
            <div className="flex flex-col items-center">
              <p className="text-text-muted text-sm mb-2">Time elapsed</p>
              <span className="text-5xl font-bold text-text-primary">
                {formatTime(elapsed)}
              </span>
            </div>
          )}
        </div>

        {/* Rules reminder */}
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4 w-full max-w-sm">
          <p className="text-text-secondary text-sm leading-relaxed">
            Describe things related to the word. The imposter doesn&apos;t know
            the word — find them!
          </p>
        </div>

        {/* Game info */}
        <p className="text-text-muted text-sm">
          {playerCount} players · {imposterCount}{" "}
          {imposterCount === 1 ? "imposter" : "imposters"}
        </p>

        {/* End discussion button */}
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={() => setShowEndModal(true)}
          className="max-w-sm"
        >
          End Discussion
        </Button>
      </div>

      {/* Confirmation modal */}
      <Modal open={showEndModal} onClose={() => setShowEndModal(false)}>
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-text-primary">
            End discussion?
          </h3>
          <p className="text-text-secondary">
            Move on to voting now?
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => setShowEndModal(false)}
            >
              Keep talking
            </Button>
            <Button
              accentColor={ACCENT}
              size="md"
              fullWidth
              onClick={handleEndEarly}
            >
              Vote now
            </Button>
          </div>
        </div>
      </Modal>
    </GameShell>
  );
}

