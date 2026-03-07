"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GameShell } from "@/components/layout/GameShell";
import { PassScreen } from "@/components/game/PassScreen";
import { PrivacyReveal } from "@/components/game/PrivacyReveal";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import { VotingScreen } from "@/components/game/VotingScreen";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { Scoreboard } from "@/components/game/Scoreboard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useGameStore, Player } from "@/lib/store";
import { useWakeLock } from "@/hooks/useWakeLock";
import { vibratePattern, vibrateSuccess, vibrateDanger } from "@/lib/haptics";
import { fireConfetti, fireWinConfetti } from "@/lib/confetti";
import { AnimatedNumber } from "@/components/game/AnimatedNumber";
import { tallyVotes, pickOddOneOut } from "@/lib/gameEngine";
import { categories } from "@/data/odd-one-out";
import { pickRandom } from "@/lib/utils";

const ACCENT = "#F59E0B";

export default function OddOneOutPlay() {
  const router = useRouter();
  const { players, oddOneOutState, updateOddOneOutState, setPlayers } =
    useGameStore();
  const { phase } = oddOneOutState;

  // No game in progress
  if (players.length === 0 || phase === "setup") {
    return (
      <GameShell title="Odd One Out" accentColor={ACCENT}>
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg mb-4">
            No game in progress
          </p>
          <button
            onClick={() => router.push("/odd-one-out")}
            className="underline cursor-pointer"
            style={{ color: ACCENT }}
          >
            Go to setup
          </button>
        </div>
      </GameShell>
    );
  }

  if (phase === "assigning") {
    return (
      <AssigningPhase
        players={players}
        currentPlayerIndex={oddOneOutState.currentPlayerIndex}
        oddOneOutPlayerIndex={oddOneOutState.oddOneOutPlayerIndex!}
        normalQuestion={oddOneOutState.currentNormalQuestion}
        oddQuestion={oddOneOutState.currentOddQuestion}
        currentRound={oddOneOutState.currentRound}
        totalRounds={oddOneOutState.totalRounds}
        onAdvance={(nextIndex) => {
          if (nextIndex >= players.length) {
            updateOddOneOutState({
              phase: "yelling",
              currentPlayerIndex: 0,
            });
          } else {
            updateOddOneOutState({ currentPlayerIndex: nextIndex });
          }
        }}
      />
    );
  }

  if (phase === "yelling") {
    return (
      <YellingPhase
        normalQuestion={oddOneOutState.currentNormalQuestion}
        currentRound={oddOneOutState.currentRound}
        totalRounds={oddOneOutState.totalRounds}
        onComplete={() => {
          updateOddOneOutState({ phase: "discussion" });
        }}
      />
    );
  }

  if (phase === "discussion") {
    return (
      <DiscussionPhase
        currentRound={oddOneOutState.currentRound}
        totalRounds={oddOneOutState.totalRounds}
        enableTimer={oddOneOutState.enableTimer}
        enableVoting={oddOneOutState.enableVoting}
        timerDuration={oddOneOutState.timerDuration}
        playerCount={players.length}
        onEnd={() => {
          const nextPhase = oddOneOutState.enableVoting ? "voting" : "reveal";
          updateOddOneOutState({ phase: nextPhase, currentPlayerIndex: 0 });
        }}
      />
    );
  }

  if (phase === "voting") {
    return (
      <VotingPhase
        players={players}
        currentPlayerIndex={oddOneOutState.currentPlayerIndex}
        votes={oddOneOutState.votes}
        onVote={(voterId, votedForId) => {
          const newVotes = { ...oddOneOutState.votes, [voterId]: votedForId };
          const nextIndex = oddOneOutState.currentPlayerIndex + 1;

          if (nextIndex >= players.length) {
            updateOddOneOutState({
              votes: newVotes,
              phase: "reveal",
              currentPlayerIndex: 0,
            });
          } else {
            updateOddOneOutState({
              votes: newVotes,
              currentPlayerIndex: nextIndex,
            });
          }
        }}
      />
    );
  }

  if (phase === "reveal") {
    return (
      <RevealPhase
        players={players}
        oddOneOutPlayerIndex={oddOneOutState.oddOneOutPlayerIndex!}
        normalQuestion={oddOneOutState.currentNormalQuestion}
        oddQuestion={oddOneOutState.currentOddQuestion}
        votes={oddOneOutState.votes}
        enableVoting={oddOneOutState.enableVoting}
        currentRound={oddOneOutState.currentRound}
        totalRounds={oddOneOutState.totalRounds}
        scores={oddOneOutState.scores}
        onNextRound={(newScores, newResult) => {
          const categoryData = categories.find(
            (c) => c.category === oddOneOutState.category
          );
          if (!categoryData) return;

          const nextRound = oddOneOutState.currentRound + 1;
          const question = pickRandom(categoryData.questions);
          const oddIndex = pickOddOneOut(players.length);

          const updatedPlayers = players.map((p) => ({
            ...p,
            score: newScores[p.id] || 0,
          }));
          setPlayers(updatedPlayers);

          updateOddOneOutState({
            currentRound: nextRound,
            currentPlayerIndex: 0,
            oddOneOutPlayerIndex: oddIndex,
            currentNormalQuestion: question.normal,
            currentOddQuestion: question.oddOneOut,
            votes: {},
            scores: newScores,
            results: [...oddOneOutState.results, newResult],
            phase: "assigning",
          });
        }}
        onEnd={(newScores, newResult) => {
          const updatedPlayers = players.map((p) => ({
            ...p,
            score: newScores[p.id] || 0,
          }));
          setPlayers(updatedPlayers);

          updateOddOneOutState({
            scores: newScores,
            results: [...oddOneOutState.results, newResult],
            phase: "end",
          });
        }}
      />
    );
  }

  if (phase === "end") {
    return (
      <EndPhase
        players={players}
        scores={oddOneOutState.scores}
        results={oddOneOutState.results}
        totalRounds={oddOneOutState.totalRounds}
        onPlayAgain={() => {
          const categoryData = categories.find(
            (c) => c.category === oddOneOutState.category
          );
          if (!categoryData) return;

          const question = pickRandom(categoryData.questions);
          const oddIndex = pickOddOneOut(players.length);

          const resetPlayers = players.map((p) => ({ ...p, score: 0 }));
          setPlayers(resetPlayers);

          updateOddOneOutState({
            currentRound: 1,
            currentPlayerIndex: 0,
            oddOneOutPlayerIndex: oddIndex,
            currentNormalQuestion: question.normal,
            currentOddQuestion: question.oddOneOut,
            votes: {},
            scores: {},
            results: [],
            phase: "assigning",
          });
        }}
        onNewGame={() => {
          updateOddOneOutState({ phase: "setup" });
          router.push("/odd-one-out");
        }}
        onHome={() => {
          updateOddOneOutState({ phase: "setup" });
          router.push("/");
        }}
      />
    );
  }

  return null;
}

// ─── Assigning Phase ──────────────────────────────────────────────────────────

function AssigningPhase({
  players,
  currentPlayerIndex,
  oddOneOutPlayerIndex,
  normalQuestion,
  oddQuestion,
  currentRound,
  totalRounds,
  onAdvance,
}: {
  players: Player[];
  currentPlayerIndex: number;
  oddOneOutPlayerIndex: number;
  normalQuestion: string;
  oddQuestion: string;
  currentRound: number;
  totalRounds: number;
  onAdvance: (nextIndex: number) => void;
}) {
  const currentPlayer = players[currentPlayerIndex];
  const isOdd = currentPlayerIndex === oddOneOutPlayerIndex;
  const question = isOdd ? oddQuestion : normalQuestion;

  const [subPhase, setSubPhase] = useState<"pass" | "reveal">("pass");

  const handleReady = useCallback(() => {
    setSubPhase("reveal");
  }, []);

  const handleDone = useCallback(() => {
    setSubPhase("pass");
    onAdvance(currentPlayerIndex + 1);
  }, [onAdvance, currentPlayerIndex]);

  const roleContent = (
    <div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-5xl mb-4"
      >
        🤔
      </motion.div>
      <p className="text-text-muted text-sm mb-2">
        Round {currentRound} of {totalRounds}
      </p>
      <h2 className="text-xl font-bold text-text-secondary mb-4">
        Your Question
      </h2>
      <div className="bg-surface border border-border rounded-[var(--radius-card)] p-5">
        <p className="text-xl font-bold" style={{ color: ACCENT }}>
          {question}
        </p>
      </div>
      <p className="text-text-muted text-sm mt-4">
        Remember your question — answer it out loud when discussion starts!
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

// ─── Yelling Phase ───────────────────────────────────────────────────────────

function YellingPhase({
  normalQuestion,
  currentRound,
  totalRounds,
  onComplete,
}: {
  normalQuestion: string;
  currentRound: number;
  totalRounds: number;
  onComplete: () => void;
}) {
  const [subPhase, setSubPhase] = useState<"countdown" | "reveal">("countdown");
  const [count, setCount] = useState(3);
  const [showYell, setShowYell] = useState(false);

  useEffect(() => {
    if (subPhase !== "countdown") return;

    if (count > 0) {
      const timer = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }

    // count === 0: show "YELL!"
    vibratePattern();
    setShowYell(true);
    const yellTimer = setTimeout(() => setSubPhase("reveal"), 2000);
    return () => clearTimeout(yellTimer);
  }, [count, subPhase]);

  if (subPhase === "countdown") {
    return (
      <GameShell title="Odd One Out" accentColor={ACCENT}>
        <div className="flex flex-col items-center justify-center text-center min-h-[60dvh]">
          <AnimatePresence mode="wait">
            {!showYell ? (
              <motion.div
                key={count}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span
                  className="text-[8rem] font-black leading-none"
                  style={{ color: ACCENT }}
                >
                  {count}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="yell"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="space-y-2"
              >
                <p
                  className="text-4xl font-black"
                  style={{ color: ACCENT }}
                >
                  YELL YOUR
                </p>
                <p
                  className="text-4xl font-black"
                  style={{ color: ACCENT }}
                >
                  ANSWER!
                </p>
                <p className="text-6xl mt-2">📣</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GameShell>
    );
  }

  // Reveal sub-phase
  return (
    <GameShell title="Odd One Out" accentColor={ACCENT}>
      <div className="flex flex-col items-center text-center gap-6 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-text-muted text-sm mb-1">
            Round {currentRound} of {totalRounds}
          </p>
          <h2 className="text-2xl font-bold" style={{ color: ACCENT }}>
            The Question Was...
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-[var(--radius-card)] p-5 w-full"
        >
          <p className="text-xl font-semibold text-text-primary">
            {normalQuestion}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-text-muted text-sm"
        >
          Someone had a different question — who was it?
        </motion.p>

        <Button
          accentColor={ACCENT}
          fullWidth
          size="lg"
          onClick={onComplete}
          className="max-w-sm"
        >
          Start Discussion
        </Button>
      </div>
    </GameShell>
  );
}

// ─── Discussion Phase ─────────────────────────────────────────────────────────

function DiscussionPhase({
  currentRound,
  totalRounds,
  enableTimer,
  enableVoting,
  timerDuration,
  playerCount,
  onEnd,
}: {
  currentRound: number;
  totalRounds: number;
  enableTimer: boolean;
  enableVoting: boolean;
  timerDuration: number | null;
  playerCount: number;
  onEnd: () => void;
}) {
  useWakeLock(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const hasTimer = enableTimer && timerDuration !== null;

  // Elapsed timer for no-limit mode
  useEffect(() => {
    if (hasTimer) return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasTimer]);

  const handleTimerComplete = useCallback(() => {
    vibratePattern();
    onEnd();
  }, [onEnd]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <GameShell title="Odd One Out" accentColor={ACCENT}>
      <div className="flex flex-col items-center text-center gap-6 pt-4">
        {/* Round info */}
        <div>
          <p className="text-text-muted text-sm mb-1">
            Round {currentRound} of {totalRounds}
          </p>
          <h2 className="text-2xl font-bold" style={{ color: ACCENT }}>
            Discussion Time
          </h2>
        </div>

        {/* Timer */}
        <div className="py-4">
          {hasTimer ? (
            <CountdownTimer
              duration={timerDuration!}
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
            Everyone answer your question out loud. Listen carefully — someone
            has a different question!
          </p>
        </div>

        {/* Game info */}
        <p className="text-text-muted text-sm">{playerCount} players</p>

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

      <Modal open={showEndModal} onClose={() => setShowEndModal(false)}>
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-text-primary">
            End discussion?
          </h3>
          <p className="text-text-secondary">
            {enableVoting
              ? "Move on to voting now?"
              : "End the discussion and reveal the answer?"}
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
              onClick={() => {
                setShowEndModal(false);
                onEnd();
              }}
            >
              {enableVoting ? "Vote now" : "Reveal"}
            </Button>
          </div>
        </div>
      </Modal>
    </GameShell>
  );
}

// ─── Voting Phase ─────────────────────────────────────────────────────────────

function VotingPhase({
  players,
  currentPlayerIndex,
  onVote,
}: {
  players: Player[];
  currentPlayerIndex: number;
  votes: Record<number, number>;
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
          <GameShell title="Odd One Out" accentColor={ACCENT}>
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

// ─── Reveal Phase ─────────────────────────────────────────────────────────────

function RevealPhase({
  players,
  oddOneOutPlayerIndex,
  normalQuestion,
  oddQuestion,
  votes,
  enableVoting,
  currentRound,
  totalRounds,
  scores,
  onNextRound,
  onEnd,
}: {
  players: Player[];
  oddOneOutPlayerIndex: number;
  normalQuestion: string;
  oddQuestion: string;
  votes: Record<number, number>;
  enableVoting: boolean;
  currentRound: number;
  totalRounds: number;
  scores: Record<number, number>;
  onNextRound: (
    newScores: Record<number, number>,
    newResult: {
      round: number;
      oddOneOutIndex: number;
      votedOutId: number;
      wasCorrect: boolean;
    }
  ) => void;
  onEnd: (
    newScores: Record<number, number>,
    newResult: {
      round: number;
      oddOneOutIndex: number;
      votedOutId: number;
      wasCorrect: boolean;
    }
  ) => void;
}) {
  useWakeLock(true);
  const [revealed, setRevealed] = useState(false);

  const oddPlayer = players[oddOneOutPlayerIndex];
  const isFinalRound = currentRound >= totalRounds;

  // Voting mode: tally votes and compute scores
  const hasVotes = enableVoting && Object.keys(votes).length > 0;
  const result = hasVotes ? tallyVotes(votes, players) : null;
  const votedOutPlayer = result
    ? players.find((p) => p.id === result.votedOutId)
    : null;
  const wasCorrect = result ? result.votedOutId === oddPlayer.id : false;

  // Calculate scores for this round
  const newScores = { ...scores };
  players.forEach((p) => {
    if (newScores[p.id] === undefined) newScores[p.id] = 0;
  });

  if (hasVotes) {
    // Each voter who correctly identified the odd one out gets +1
    Object.entries(votes).forEach(([voterId, votedForId]) => {
      if (votedForId === oddPlayer.id) {
        newScores[Number(voterId)] = (newScores[Number(voterId)] || 0) + 1;
      }
    });

    // If the odd one out survived (wasn't voted out), they get +2
    if (!wasCorrect) {
      newScores[oddPlayer.id] = (newScores[oddPlayer.id] || 0) + 2;
    }
  }

  const roundResult = {
    round: currentRound,
    oddOneOutIndex: oddOneOutPlayerIndex,
    votedOutId: result?.votedOutId ?? -1,
    wasCorrect,
  };

  // Haptic + confetti on reveal (voting mode only — no-voting mode fires via button)
  useEffect(() => {
    if (!enableVoting) return;
    if (hasVotes) {
      if (wasCorrect) {
        vibrateSuccess();
        fireConfetti(["#F59E0B", "#10B981"]);
      } else {
        vibrateDanger();
      }
    }
  }, [wasCorrect, hasVotes, enableVoting]);

  // No-voting mode: show a "reveal" button first
  if (!enableVoting && !revealed) {
    return (
      <GameShell title="Odd One Out" accentColor={ACCENT}>
        <div className="flex flex-col items-center text-center gap-6 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-text-muted text-sm mb-1">
              Round {currentRound} of {totalRounds}
            </p>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Who do you think it was?
            </h2>
            <p className="text-text-secondary text-sm">
              Discuss and decide, then reveal the answer.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl py-4"
          >
            🤔
          </motion.div>

          <p className="text-text-muted text-sm">
            {players.length} players
          </p>

          <Button
            accentColor="#EF4444"
            fullWidth
            size="lg"
            onClick={() => {
              vibrateDanger();
              setRevealed(true);
            }}
            className="max-w-sm"
          >
            Reveal Answer
          </Button>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Odd One Out" accentColor={ACCENT}>
      <div className="flex flex-col items-center text-center gap-5 pt-2">
        {/* Round header */}
        <p className="text-text-muted text-sm">
          Round {currentRound} of {totalRounds}
        </p>

        {/* Outcome */}
        {hasVotes ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2
              className="text-2xl font-bold"
              style={{ color: wasCorrect ? "#10B981" : "#EF4444" }}
            >
              {wasCorrect
                ? "The group found the Odd One Out!"
                : "The Odd One Out survived!"}
            </h2>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-bold" style={{ color: ACCENT }}>
              The Odd One Out was...
            </h2>
          </motion.div>
        )}

        {/* Voted out (only in voting mode) */}
        {hasVotes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-5 w-full"
          >
            <p className="text-text-muted text-sm mb-2">Voted Out</p>
            <p className="text-2xl font-bold text-text-primary mb-1">
              {votedOutPlayer?.name}
            </p>
            <p
              className={`text-lg font-semibold ${
                wasCorrect ? "text-success" : "text-danger"
              }`}
            >
              {wasCorrect
                ? "They had the different question!"
                : "They had the same question as everyone else!"}
            </p>
            {result!.isTie && (
              <p className="text-text-muted text-xs mt-1">
                (Tie — first player with most votes was eliminated)
              </p>
            )}
          </motion.div>
        )}

        {/* The odd one out reveal */}
        {(!hasVotes || !wasCorrect) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasVotes ? 0.5 : 0.3 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-5 w-full"
          >
            <p className="text-text-muted text-sm mb-2">
              {hasVotes ? "The real Odd One Out" : "The Odd One Out"}
            </p>
            <p className="text-2xl font-bold" style={{ color: ACCENT }}>
              {oddPlayer.name}
            </p>
          </motion.div>
        )}

        {/* Questions side by side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasVotes ? 0.7 : 0.5 }}
          className="w-full space-y-3"
        >
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4">
            <p className="text-text-muted text-xs mb-1 uppercase tracking-wider">
              Normal Question
            </p>
            <p className="text-sm font-semibold text-text-primary">
              {normalQuestion}
            </p>
          </div>
          <div
            className="border rounded-[var(--radius-card)] p-4"
            style={{
              backgroundColor: `${ACCENT}10`,
              borderColor: ACCENT,
            }}
          >
            <p
              className="text-xs mb-1 uppercase tracking-wider"
              style={{ color: ACCENT }}
            >
              Odd One Out Question
            </p>
            <p className="text-sm font-semibold text-text-primary">
              {oddQuestion}
            </p>
          </div>
        </motion.div>

        {/* Vote breakdown (only in voting mode) */}
        {hasVotes && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-surface border border-border rounded-[var(--radius-card)] p-5 w-full"
            >
              <p className="text-text-muted text-sm mb-3">Vote Breakdown</p>
              <div className="space-y-2">
                {players
                  .map((p) => ({
                    player: p,
                    count: result!.voteCounts[p.id] || 0,
                  }))
                  .sort((a, b) => b.count - a.count)
                  .map(({ player, count }) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between"
                    >
                      <span
                        className={`text-sm font-medium ${
                          player.id === oddPlayer.id
                            ? "text-warning"
                            : "text-text-secondary"
                        }`}
                      >
                        {player.name}
                        {player.id === oddPlayer.id && " 🤔"}
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
                              player.id === result!.votedOutId
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

            {/* Scoring summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="bg-surface border border-border rounded-[var(--radius-card)] p-5 w-full"
            >
              <p className="text-text-muted text-sm mb-3">Round Scoring</p>
              <div className="space-y-1 text-sm">
                {Object.entries(votes).map(([voterId, votedForId]) => {
                  const voter = players.find(
                    (p) => p.id === Number(voterId)
                  );
                  const correct = votedForId === oddPlayer.id;
                  if (!voter) return null;
                  return (
                    <div
                      key={voterId}
                      className="flex items-center justify-between"
                    >
                      <span className="text-text-secondary">
                        {voter.name}
                      </span>
                      <span
                        className={
                          correct
                            ? "text-success font-bold"
                            : "text-text-muted"
                        }
                      >
                        {correct ? "+1" : "0"}
                      </span>
                    </div>
                  );
                })}
                {!wasCorrect && (
                  <div className="flex items-center justify-between border-t border-border pt-1 mt-1">
                    <span style={{ color: ACCENT }} className="font-medium">
                      {oddPlayer.name} (survived)
                    </span>
                    <span className="text-success font-bold">+2</span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Action button */}
        <Button
          accentColor={ACCENT}
          fullWidth
          size="lg"
          onClick={() => {
            if (isFinalRound) {
              onEnd(newScores, roundResult);
            } else {
              onNextRound(newScores, roundResult);
            }
          }}
        >
          {isFinalRound ? "See Final Results" : "Next Round"}
        </Button>
      </div>
    </GameShell>
  );
}

// ─── End Phase ────────────────────────────────────────────────────────────────

function EndPhase({
  players,
  scores,
  results,
  totalRounds,
  onPlayAgain,
  onNewGame,
  onHome,
}: {
  players: Player[];
  scores: Record<number, number>;
  results: Array<{
    round: number;
    oddOneOutIndex: number;
    votedOutId: number;
    wasCorrect: boolean;
  }>;
  totalRounds: number;
  onPlayAgain: () => void;
  onNewGame: () => void;
  onHome: () => void;
}) {
  useWakeLock(true);

  // Build players with final scores for Scoreboard
  const scoredPlayers = players.map((p) => ({
    ...p,
    score: scores[p.id] || 0,
  }));

  const correctGuesses = results.filter((r) => r.wasCorrect).length;

  useEffect(() => {
    vibrateSuccess();
    fireWinConfetti();
  }, []);

  return (
    <GameShell title="Odd One Out" accentColor={ACCENT}>
      <ResultsScreen
        title="Game Over!"
        subtitle={`${correctGuesses} of ${totalRounds} odd ones out were caught`}
        accentColor={ACCENT}
        onPlayAgain={onPlayAgain}
        onNewGame={onNewGame}
        onHome={onHome}
      >
        <div className="w-full space-y-5">
          <Scoreboard players={scoredPlayers} accentColor={ACCENT} />

          {/* Round history */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-5"
          >
            <p className="text-text-muted text-sm mb-3">Round History</p>
            <div className="space-y-2">
              {results.map((r) => {
                const oddPlayer = players[r.oddOneOutIndex];
                return (
                  <div
                    key={r.round}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-text-muted">Round {r.round}</span>
                    <span className="text-text-secondary">
                      {oddPlayer?.name} was odd
                    </span>
                    <span
                      className={
                        r.wasCorrect ? "text-success" : "text-danger"
                      }
                    >
                      {r.wasCorrect ? "Caught!" : "Escaped!"}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </ResultsScreen>
    </GameShell>
  );
}
