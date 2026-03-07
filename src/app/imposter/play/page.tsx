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
import { VotingScreen } from "@/components/game/VotingScreen";
import { useGameStore } from "@/lib/store";
import { useWakeLock } from "@/hooks/useWakeLock";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { vibratePattern, vibrateSuccess, vibrateDanger } from "@/lib/haptics";
import { fireConfetti, fireWinConfetti } from "@/lib/confetti";
import { AnimatedNumber } from "@/components/game/AnimatedNumber";
import { tallyVotes, checkImposterWin, pickStartingPlayer } from "@/lib/gameEngine";
import { categories } from "@/data/imposter";
import { assignImposterRoles, pickWord, rollChaosRound } from "@/lib/gameEngine";

const ACCENT = "#8B5CF6";

type PlayPhase = "pass" | "reveal";

export default function ImposterPlay() {
  const router = useRouter();
  const { players, imposterState, updateImposterState } = useGameStore();
  const {
    phase,
    currentPlayerIndex,
    imposterIndices,
    secretWord,
    secretHint,
    category,
    showCategoryToImposter,
    showHintToImposter,
  } = imposterState;

  // If no players or still in setup, redirect back
  if (players.length === 0 || phase === "setup") {
    return (
      <GameShell title="Imposter" accentColor={ACCENT}>
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
        secretHint={secretHint}
        category={category}
        showCategoryToImposter={showCategoryToImposter}
        showHintToImposter={showHintToImposter}
        onAdvance={(nextIndex) => {
          if (nextIndex >= players.length) {
            // All players have seen their roles — pick starting player
            const starter = pickStartingPlayer(
              players.length,
              imposterState.imposterIndices
            );
            updateImposterState({
              phase: "starting",
              startingPlayerIndex: starter,
              currentPlayerIndex: 0,
            });
          } else {
            updateImposterState({ currentPlayerIndex: nextIndex });
          }
        }}
      />
    );
  }

  // Starting player phase
  if (phase === "starting") {
    return (
      <StartingPlayerPhase
        playerName={
          imposterState.startingPlayerIndex !== null
            ? players[imposterState.startingPlayerIndex]?.name ?? "?"
            : "?"
        }
        onContinue={() => {
          const nextPhase = imposterState.enableTimer
            ? "discussion"
            : imposterState.enableVoting
              ? "voting"
              : "reveal";
          updateImposterState({ phase: nextPhase, currentPlayerIndex: 0 });
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
        enableVoting={imposterState.enableVoting}
        onEnd={() =>
          updateImposterState({
            phase: imposterState.enableVoting ? "voting" : "reveal",
          })
        }
      />
    );
  }

  // Voting phase
  if (phase === "voting") {
    return (
      <VotingPhase
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        onVote={(voterId, votedForId) => {
          const newVotes = { ...imposterState.votes, [voterId]: votedForId };
          const nextIndex = currentPlayerIndex + 1;

          if (nextIndex >= players.length) {
            updateImposterState({
              votes: newVotes,
              phase: "results",
              currentPlayerIndex: 0,
            });
          } else {
            updateImposterState({
              votes: newVotes,
              currentPlayerIndex: nextIndex,
            });
          }
        }}
      />
    );
  }

  // Reveal phase (no voting — just reveal imposter + word)
  if (phase === "reveal") {
    return (
      <RevealPhase
        players={players}
        imposterIndices={imposterIndices}
        secretWord={secretWord}
        category={category}
        imposterCount={imposterState.imposterCount}
        playerCount={players.length}
        isChaosRound={imposterState.isChaosRound}
        onPlayAgain={() => {
          const categoryData = categories.find((c) => c.category === category);
          if (!categoryData) return;
          const { word: newWord, hint: newHint } = pickWord(categoryData, imposterState.difficulty);
          let newIndices = assignImposterRoles(
            players.length,
            imposterState.imposterCount
          );
          const chaos = rollChaosRound();
          if (chaos) {
            newIndices = Array.from({ length: players.length }, (_, i) => i);
          }
          updateImposterState({
            secretWord: newWord,
            secretHint: newHint,
            imposterIndices: newIndices,
            isChaosRound: chaos,
            currentPlayerIndex: 0,
            phase: "assigning",
            votes: {},
          });
        }}
        onNewGame={() => {
          updateImposterState({ phase: "setup" });
          router.push("/imposter");
        }}
        onHome={() => {
          updateImposterState({ phase: "setup" });
          router.push("/");
        }}
      />
    );
  }

  // Results phase
  if (phase === "results") {
    return (
      <ResultsPhase
        players={players}
        imposterIndices={imposterIndices}
        votes={imposterState.votes}
        secretWord={secretWord}
        category={category}
        isChaosRound={imposterState.isChaosRound}
        onPlayAgain={() => {
          const categoryData = categories.find((c) => c.category === category);
          if (!categoryData) return;
          const { word: newWord, hint: newHint } = pickWord(categoryData, imposterState.difficulty);
          let newIndices = assignImposterRoles(
            players.length,
            imposterState.imposterCount
          );
          const chaos = rollChaosRound();
          if (chaos) {
            newIndices = Array.from({ length: players.length }, (_, i) => i);
          }
          updateImposterState({
            secretWord: newWord,
            secretHint: newHint,
            imposterIndices: newIndices,
            isChaosRound: chaos,
            currentPlayerIndex: 0,
            phase: "assigning",
            votes: {},
          });
        }}
        onNewGame={() => {
          updateImposterState({ phase: "setup" });
          router.push("/imposter");
        }}
        onHome={() => {
          updateImposterState({ phase: "setup" });
          router.push("/");
        }}
      />
    );
  }

  return null;
}

function AssigningPhase({
  players,
  currentPlayerIndex,
  imposterIndices,
  secretWord,
  secretHint,
  category,
  showCategoryToImposter,
  showHintToImposter,
  onAdvance,
}: {
  players: { id: number; name: string }[];
  currentPlayerIndex: number;
  imposterIndices: number[];
  secretWord: string;
  secretHint: string;
  category: string;
  showCategoryToImposter: boolean;
  showHintToImposter: boolean;
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
      {showCategoryToImposter && (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4 mt-4 inline-block">
          <p className="text-text-muted text-sm mb-1">Category</p>
          <p className="text-xl font-bold text-text-primary">{category}</p>
        </div>
      )}
      {showHintToImposter && secretHint && (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4 mt-4 inline-block">
          <p className="text-text-muted text-sm mb-1">Hint</p>
          <p className="text-lg font-bold text-warning">{secretHint}</p>
        </div>
      )}
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

function StartingPlayerPhase({
  playerName,
  onContinue,
}: {
  playerName: string;
  onContinue: () => void;
}) {
  return (
    <GameShell title="Imposter" accentColor={ACCENT}>
      <div className="flex flex-col items-center justify-center text-center gap-6 min-h-[60dvh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-text-muted text-sm mb-2">First to give a word...</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
        >
          <p className="text-5xl font-black" style={{ color: ACCENT }}>
            {playerName}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-6xl"
        >
          👆
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-sm"
        >
          <Button
            accentColor={ACCENT}
            fullWidth
            size="lg"
            onClick={onContinue}
          >
            Continue
          </Button>
        </motion.div>
      </div>
    </GameShell>
  );
}

function DiscussionPhase({
  category,
  timerDuration,
  playerCount,
  imposterCount,
  enableVoting,
  onEnd,
}: {
  category: string;
  timerDuration: number | null;
  playerCount: number;
  imposterCount: number;
  enableVoting: boolean;
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
    <GameShell title="Imposter" accentColor={ACCENT}>
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
            {enableVoting
              ? "Move on to voting now?"
              : "End the discussion and reveal the imposter?"}
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
              {enableVoting ? "Vote now" : "Reveal"}
            </Button>
          </div>
        </div>
      </Modal>
    </GameShell>
  );
}

function VotingPhase({
  players,
  currentPlayerIndex,
  onVote,
}: {
  players: { id: number; name: string; score: number }[];
  currentPlayerIndex: number;
  onVote: (voterId: number, votedForId: number) => void;
}) {
  const [subPhase, setSubPhase] = useState<"pass" | "vote">("pass");
  const currentPlayer = players[currentPlayerIndex];

  const handleReady = useCallback(() => {
    setSubPhase("vote");
  }, []);

  const handleVote = useCallback(
    (votedForId: number) => {
      setSubPhase("pass");
      onVote(currentPlayer.id, votedForId);
    },
    [onVote, currentPlayer.id]
  );

  return (
    <AnimatePresence mode="wait">
      {subPhase === "pass" ? (
        <PassScreen
          key={`vote-pass-${currentPlayerIndex}`}
          playerName={currentPlayer.name}
          onReady={handleReady}
          accentColor={ACCENT}
        />
      ) : (
        <motion.div
          key={`vote-screen-${currentPlayerIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <GameShell title="Imposter" accentColor={ACCENT}>
            <VotingScreen
              voter={currentPlayer}
              players={players}
              accentColor={ACCENT}
              onVote={handleVote}
            />
          </GameShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RevealPhase({
  players,
  imposterIndices,
  secretWord,
  category,
  imposterCount,
  playerCount,
  isChaosRound,
  onPlayAgain,
  onNewGame,
  onHome,
}: {
  players: { id: number; name: string; score: number }[];
  imposterIndices: number[];
  secretWord: string;
  category: string;
  imposterCount: number;
  playerCount: number;
  isChaosRound: boolean;
  onPlayAgain: () => void;
  onNewGame: () => void;
  onHome: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  useWakeLock(true);

  const imposterNames = imposterIndices
    .map((i) => players[i]?.name)
    .filter(Boolean);

  const handleReveal = () => {
    vibrateDanger();
    setRevealed(true);
    if (isChaosRound) {
      fireConfetti(["#EF4444", "#8B5CF6"]);
    }
  };

  if (!revealed) {
    return (
      <GameShell title="Imposter" accentColor={ACCENT}>
        <div className="flex flex-col items-center text-center gap-6 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Discuss amongst yourselves!
            </h2>
            <p className="text-text-secondary text-sm">
              Talk it out, then reveal when ready.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-5 w-full max-w-sm"
          >
            <p className="text-text-muted text-sm mb-1">Category</p>
            <p className="text-2xl font-bold" style={{ color: ACCENT }}>
              {category}
            </p>
          </motion.div>

          <p className="text-text-muted text-sm">
            {playerCount} players · {imposterCount}{" "}
            {imposterCount === 1 ? "imposter" : "imposters"}
          </p>

          <Button
            accentColor="#EF4444"
            fullWidth
            size="lg"
            onClick={handleReveal}
            className="max-w-sm"
          >
            Reveal Imposter
          </Button>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Imposter" accentColor={ACCENT}>
      <ResultsScreen
        title={isChaosRound ? "Plot Twist!" : "The Imposter Revealed!"}
        accentColor={ACCENT}
        onPlayAgain={onPlayAgain}
        onNewGame={onNewGame}
        onHome={onHome}
      >
        <div className="space-y-5 w-full">
          {/* Imposter reveal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-5"
          >
            {isChaosRound ? (
              <div className="text-center">
                <p className="text-3xl font-black text-danger mb-2">
                  EVERYONE was the Imposter!
                </p>
                <p className="text-text-secondary text-sm">
                  Nobody knew the word. Pure chaos.
                </p>
              </div>
            ) : (
              <>
                <p className="text-text-muted text-sm mb-2">
                  {imposterNames.length === 1 ? "The Imposter" : "The Imposters"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {imposterNames.map((name, i) => (
                    <motion.span
                      key={name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.2 }}
                      className="text-2xl font-bold text-danger"
                    >
                      {name}
                    </motion.span>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Secret word */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-5"
          >
            <p className="text-text-muted text-sm mb-1">
              {isChaosRound ? "The Word Nobody Knew" : "The Secret Word"}
            </p>
            <p className="text-3xl font-black" style={{ color: ACCENT }}>
              {secretWord}
            </p>
            <p className="text-text-muted text-sm mt-1">{category}</p>
          </motion.div>
        </div>
      </ResultsScreen>
    </GameShell>
  );
}

function ResultsPhase({
  players,
  imposterIndices,
  votes,
  secretWord,
  category,
  isChaosRound,
  onPlayAgain,
  onNewGame,
  onHome,
}: {
  players: { id: number; name: string; score: number }[];
  imposterIndices: number[];
  votes: Record<number, number>;
  secretWord: string;
  category: string;
  isChaosRound: boolean;
  onPlayAgain: () => void;
  onNewGame: () => void;
  onHome: () => void;
}) {
  const result = tallyVotes(votes, players);
  const imposterWins = checkImposterWin(
    result.votedOutId,
    imposterIndices,
    players
  );

  const votedOutPlayer = players.find((p) => p.id === result.votedOutId);
  const imposterNames = imposterIndices.map((i) => players[i]?.name).filter(Boolean);

  // Check if voted-out player was an imposter
  const votedOutIndex = players.findIndex((p) => p.id === result.votedOutId);
  const votedOutWasImposter = imposterIndices.includes(votedOutIndex);

  // Haptic + confetti on mount
  useEffect(() => {
    if (isChaosRound) {
      vibrateDanger();
      fireConfetti(["#EF4444", "#8B5CF6"]);
    } else if (imposterWins) {
      vibrateDanger();
      fireConfetti(["#EF4444", "#8B5CF6"]);
    } else {
      vibrateSuccess();
      fireWinConfetti();
    }
  }, [imposterWins, isChaosRound]);

  const title = isChaosRound
    ? "Total Chaos!"
    : imposterWins
      ? "The Imposter Wins!"
      : "The Group Wins!";

  return (
    <GameShell title="Imposter" accentColor={ACCENT}>
      <ResultsScreen
        title={title}
        accentColor={ACCENT}
        onPlayAgain={onPlayAgain}
        onNewGame={onNewGame}
        onHome={onHome}
      >
        <div className="space-y-5 w-full">
          {/* Chaos reveal or voted out reveal */}
          {isChaosRound ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface border border-border rounded-[var(--radius-card)] p-5"
            >
              <div className="text-center">
                <p className="text-3xl font-black text-danger mb-2">
                  EVERYONE was the Imposter!
                </p>
                <p className="text-text-secondary text-sm">
                  Nobody knew the word. Pure chaos.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface border border-border rounded-[var(--radius-card)] p-5"
            >
              <p className="text-text-muted text-sm mb-2">Voted Out</p>
              <p className="text-2xl font-bold text-text-primary mb-1">
                {votedOutPlayer?.name}
              </p>
              <p
                className={`text-lg font-semibold ${
                  votedOutWasImposter ? "text-success" : "text-danger"
                }`}
              >
                {votedOutWasImposter
                  ? "They were the Imposter!"
                  : "They were innocent!"}
              </p>
              {result.isTie && (
                <p className="text-text-muted text-xs mt-1">
                  (Tie — first player with most votes was eliminated)
                </p>
              )}
            </motion.div>
          )}

          {/* Imposter reveal (skip in chaos — already shown above) */}
          {!isChaosRound && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-surface border border-border rounded-[var(--radius-card)] p-5"
            >
              <p className="text-text-muted text-sm mb-2">
                {imposterNames.length === 1 ? "The Imposter" : "The Imposters"}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {imposterNames.map((name) => (
                  <span
                    key={name}
                    className="text-xl font-bold text-danger"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Secret word */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isChaosRound ? 0.6 : 0.9 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-5"
          >
            <p className="text-text-muted text-sm mb-1">
              {isChaosRound ? "The Word Nobody Knew" : "The Secret Word"}
            </p>
            <p className="text-3xl font-black" style={{ color: ACCENT }}>
              {secretWord}
            </p>
            <p className="text-text-muted text-sm mt-1">{category}</p>
          </motion.div>

          {/* Vote breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isChaosRound ? 0.9 : 1.2 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-5"
          >
            <p className="text-text-muted text-sm mb-3">Vote Breakdown</p>
            <div className="space-y-2">
              {players
                .map((p) => ({
                  player: p,
                  count: result.voteCounts[p.id] || 0,
                }))
                .sort((a, b) => b.count - a.count)
                .map(({ player, count }) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between"
                  >
                    <span
                      className={`text-sm font-medium ${
                        isChaosRound
                          ? "text-danger"
                          : imposterIndices.includes(
                              players.findIndex((p) => p.id === player.id)
                            )
                            ? "text-danger"
                            : "text-text-secondary"
                      }`}
                    >
                      {player.name}
                      {(isChaosRound ||
                        imposterIndices.includes(
                          players.findIndex((p) => p.id === player.id)
                        )) && " 🕵️"}
                    </span>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="h-2 rounded-full"
                        initial={{ width: 8 }}
                        animate={{
                          width: Math.max(
                            8,
                            (count / players.length) * 120
                          ),
                        }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        style={{
                          backgroundColor:
                            player.id === result.votedOutId
                              ? "#EF4444"
                              : ACCENT,
                        }}
                      />
                      <AnimatedNumber
                        value={count}
                        duration={0.6}
                        delay={0.3}
                        className="text-text-muted text-xs w-4"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      </ResultsScreen>
    </GameShell>
  );
}
