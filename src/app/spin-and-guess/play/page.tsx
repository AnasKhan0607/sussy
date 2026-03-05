"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GameShell } from "@/components/layout/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PassScreen } from "@/components/game/PassScreen";
import { ArchSpinner } from "@/components/game/ArchSpinner";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { useGameStore, SpinAndGuessAssignment, SpinAndGuessRound } from "@/lib/store";
import { vibrateSuccess } from "@/lib/haptics";
import { fireConfetti, fireWinConfetti } from "@/lib/confetti";
import { useWakeLock } from "@/hooks/useWakeLock";
import {
  categories as allCategories,
  scales as allScales,
  getScale,
  type Category,
  type Scale,
} from "@/data/spin-and-guess";
import { shuffle } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ACCENT = "#06B6D4";

export default function SpinAndGuessPlay() {
  const router = useRouter();
  const { players, spinAndGuessState, updateSpinAndGuessState } =
    useGameStore();
  const state = spinAndGuessState;

  useWakeLock(true);

  if (players.length === 0 || state.phase === "setup") {
    return (
      <GameShell title="Spin & Guess" accentColor={ACCENT}>
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg mb-4">
            No game in progress
          </p>
          <button
            onClick={() => router.push("/spin-and-guess")}
            className="underline cursor-pointer"
            style={{ color: ACCENT }}
          >
            Go to setup
          </button>
        </div>
      </GameShell>
    );
  }

  if (state.phase === "assign-categories") {
    return (
      <AssignCategoriesPhase
        players={players}
        guesserIndex={state.guesserIndex}
        roundNumber={state.roundNumber}
        onDone={(assignments, customCategory) => {
          updateSpinAndGuessState({
            assignments,
            customCategory,
            phase: "spinning",
          });
        }}
      />
    );
  }

  if (state.phase === "spinning") {
    return (
      <SpinningPhase
        guesserName={players[state.guesserIndex]?.name || "Guesser"}
        onResult={(n) => {
          updateSpinAndGuessState({
            secretNumber: n,
            phase: "clues",
            currentClueIndex: 0,
            clues: {},
          });
        }}
      />
    );
  }

  if (state.phase === "clues") {
    const nonGuessers = players.filter(
      (_, i) => i !== state.guesserIndex
    );
    return (
      <CluesPhase
        players={players}
        nonGuessers={nonGuessers}
        guesserIndex={state.guesserIndex}
        assignments={state.assignments}
        customCategory={state.customCategory}
        secretNumber={state.secretNumber!}
        currentClueIndex={state.currentClueIndex}
        clues={state.clues}
        onClue={(playerIndex, clue) => {
          const newClues = { ...state.clues, [playerIndex]: clue };
          const nextClueIdx = state.currentClueIndex + 1;

          if (nextClueIdx >= nonGuessers.length) {
            updateSpinAndGuessState({
              clues: newClues,
              phase: "guessing",
            });
          } else {
            updateSpinAndGuessState({
              clues: newClues,
              currentClueIndex: nextClueIdx,
            });
          }
        }}
      />
    );
  }

  if (state.phase === "guessing") {
    return (
      <GuessingPhase
        guesserName={players[state.guesserIndex]?.name || "Guesser"}
        players={players}
        guesserIndex={state.guesserIndex}
        assignments={state.assignments}
        customCategory={state.customCategory}
        clues={state.clues}
        onGuess={(guess) => {
          updateSpinAndGuessState({
            guess,
            phase: "reveal",
          });
        }}
      />
    );
  }

  if (state.phase === "reveal") {
    return (
      <RevealPhase
        players={players}
        state={state}
        onNextRound={() => {
          const diff = Math.abs(
            (state.guess ?? 0) - (state.secretNumber ?? 0)
          );
          const roundScore =
            diff === 0 ? 10 : diff === 1 ? 7 : diff === 2 ? 4 : diff === 3 ? 1 : 0;

          const newScores = { ...state.scores };
          newScores[state.guesserIndex] =
            (newScores[state.guesserIndex] || 0) + roundScore;

          const roundEntry = {
            guesserIndex: state.guesserIndex,
            secretNumber: state.secretNumber!,
            guess: state.guess!,
            clues: state.clues,
            score: roundScore,
          };

          const nextRound = state.roundNumber + 1;

          if (nextRound > state.totalRounds) {
            updateSpinAndGuessState({
              scores: newScores,
              roundHistory: [...state.roundHistory, roundEntry],
              phase: "end",
            });
          } else {
            const nextGuesser =
              (state.guesserIndex + 1) % players.length;
            updateSpinAndGuessState({
              scores: newScores,
              roundHistory: [...state.roundHistory, roundEntry],
              roundNumber: nextRound,
              guesserIndex: nextGuesser,
              secretNumber: null,
              assignments: [],
              customCategory: null,
              clues: {},
              guess: null,
              currentClueIndex: 0,
              phase: "assign-categories",
            });
          }
        }}
      />
    );
  }

  if (state.phase === "end") {
    return (
      <EndScreen
        players={players}
        scores={state.scores}
        roundHistory={state.roundHistory}
        onPlayAgain={() => {
          const initialScores: Record<number, number> = {};
          players.forEach((p) => (initialScores[p.id] = 0));
          updateSpinAndGuessState({
            phase: "assign-categories",
            guesserIndex: 0,
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
        }}
        onNewGame={() => {
          updateSpinAndGuessState({ phase: "setup" });
          router.push("/spin-and-guess");
        }}
        onHome={() => {
          updateSpinAndGuessState({ phase: "setup" });
          router.push("/");
        }}
      />
    );
  }

  return null;
}

// ── Assign Categories Phase ──────────────────────────────────────

function AssignCategoriesPhase({
  players,
  guesserIndex,
  roundNumber,
  onDone,
}: {
  players: { id: number; name: string }[];
  guesserIndex: number;
  roundNumber: number;
  onDone: (
    assignments: SpinAndGuessAssignment[],
    customCategory: { label: string; scaleId: string; playerIndex: number } | null
  ) => void;
}) {
  const nonGuessers = players.filter((_, i) => i !== guesserIndex);
  const guesser = players[guesserIndex];

  // Pick random categories for this round (one per non-guesser)
  const [roundCategories] = useState(() =>
    shuffle([...allCategories]).slice(0, nonGuessers.length)
  );

  // For each category, pick a random valid scale
  const [categoryScales] = useState(() =>
    roundCategories.map((cat) => {
      const scaleId = cat.scales[Math.floor(Math.random() * cat.scales.length)];
      return { categoryId: cat.id, scaleId };
    })
  );

  // Assignment: which player gets which category
  const [assignments, setAssignments] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    roundCategories.forEach((cat, i) => {
      // Default: assign in order
      if (i < nonGuessers.length) {
        initial[cat.id] = nonGuessers[i].id;
      }
    });
    return initial;
  });

  // Custom category
  const [customLabel, setCustomLabel] = useState("");
  const [customScaleId, setCustomScaleId] = useState(allScales[0].id);
  const [customPlayerIdx, setCustomPlayerIdx] = useState(nonGuessers[0]?.id ?? 0);
  const [showCustom, setShowCustom] = useState(false);

  const handleDone = () => {
    const assignmentList: SpinAndGuessAssignment[] = roundCategories.map(
      (cat, i) => ({
        playerIndex: players.findIndex((p) => p.id === assignments[cat.id]),
        categoryId: cat.id,
        scaleId: categoryScales[i].scaleId,
      })
    );

    const custom =
      showCustom && customLabel.trim()
        ? {
            label: customLabel.trim(),
            scaleId: customScaleId,
            playerIndex: players.findIndex((p) => p.id === customPlayerIdx),
          }
        : null;

    onDone(assignmentList, custom);
  };

  return (
    <GameShell title="Spin & Guess" accentColor={ACCENT}>
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-text-muted text-sm">
            Round {roundNumber}
          </p>
          <h2 className="text-xl font-bold" style={{ color: ACCENT }}>
            {guesser.name} is the Guesser
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Assign each category to a friend
          </p>
        </div>

        {/* Category assignments */}
        <div className="space-y-3">
          {roundCategories.map((cat, i) => {
            const scale = getScale(categoryScales[i].scaleId);
            return (
              <Card key={cat.id}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{cat.label}</p>
                      <p className="text-text-muted text-xs">
                        {scale?.label}
                      </p>
                    </div>
                  </div>
                  <select
                    value={assignments[cat.id] ?? ""}
                    onChange={(e) =>
                      setAssignments((prev) => ({
                        ...prev,
                        [cat.id]: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary cursor-pointer"
                  >
                    {nonGuessers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Custom category */}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="text-sm underline cursor-pointer block"
          style={{ color: ACCENT }}
        >
          {showCustom ? "Remove custom category" : "+ Add a custom category"}
        </button>

        {showCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
          >
            <Card>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Category name (e.g., 'Rappers')"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                />
                <select
                  value={customScaleId}
                  onChange={(e) => setCustomScaleId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary cursor-pointer"
                >
                  {allScales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <select
                  value={customPlayerIdx}
                  onChange={(e) => setCustomPlayerIdx(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary cursor-pointer"
                >
                  {nonGuessers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          </motion.div>
        )}

        <Button accentColor={ACCENT} fullWidth size="lg" onClick={handleDone}>
          Done Assigning
        </Button>
      </div>
    </GameShell>
  );
}

// ── Spinning Phase ───────────────────────────────────────────────

function SpinningPhase({
  guesserName,
  onResult,
}: {
  guesserName: string;
  onResult: (n: number) => void;
}) {
  const [showSpinner, setShowSpinner] = useState(false);

  if (!showSpinner) {
    return (
      <PassScreen
        playerName={`anyone except ${guesserName}`}
        onReady={() => setShowSpinner(true)}
        accentColor={ACCENT}
      />
    );
  }

  return (
    <GameShell title="Spin & Guess" accentColor={ACCENT}>
      <div className="flex flex-col items-center gap-4 pt-4">
        <p className="text-text-secondary text-sm">
          {guesserName}, look away!
        </p>
        <ArchSpinner onResult={onResult} accentColor={ACCENT} />
      </div>
    </GameShell>
  );
}

// ── Clues Phase ──────────────────────────────────────────────────

function CluesPhase({
  players,
  nonGuessers,
  guesserIndex,
  assignments,
  customCategory,
  secretNumber,
  currentClueIndex,
  clues,
  onClue,
}: {
  players: { id: number; name: string }[];
  nonGuessers: { id: number; name: string }[];
  guesserIndex: number;
  assignments: SpinAndGuessAssignment[];
  customCategory: { label: string; scaleId: string; playerIndex: number } | null;
  secretNumber: number;
  currentClueIndex: number;
  clues: Record<number, string>;
  onClue: (playerIndex: number, clue: string) => void;
}) {
  const [subPhase, setSubPhase] = useState<"pass" | "clue">("pass");
  const currentPlayer = nonGuessers[currentClueIndex];
  const playerIndex = players.findIndex((p) => p.id === currentPlayer.id);

  // Find this player's assignment
  const assignment = assignments.find((a) => a.playerIndex === playerIndex);
  const category = allCategories.find((c) => c.id === assignment?.categoryId);
  const scale = assignment ? getScale(assignment.scaleId) : null;

  // Also check if they have the custom category
  const hasCustom = customCategory?.playerIndex === playerIndex;

  const [clueText, setClueText] = useState("");

  const handleSubmit = useCallback(() => {
    if (!clueText.trim()) return;
    const finalClue = clueText.trim();
    setClueText("");
    setSubPhase("pass");
    onClue(playerIndex, finalClue);
  }, [clueText, playerIndex, onClue]);

  if (subPhase === "pass") {
    return (
      <PassScreen
        key={`clue-pass-${currentClueIndex}`}
        playerName={currentPlayer.name}
        onReady={() => setSubPhase("clue")}
        accentColor={ACCENT}
      />
    );
  }

  return (
    <motion.div
      key={`clue-input-${currentClueIndex}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <GameShell title="Spin & Guess" accentColor={ACCENT}>
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-text-muted text-sm mb-1">
              {currentPlayer.name}, give a clue!
            </p>
          </div>

          {/* Secret number */}
          <div className="text-center">
            <p className="text-text-muted text-sm">The number is</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl font-black"
              style={{ color: ACCENT }}
            >
              {secretNumber}
            </motion.p>
          </div>

          {/* Their category */}
          {category && scale && (
            <Card>
              <div className="text-center">
                <span className="text-2xl">{category.emoji}</span>
                <p className="font-bold mt-1">{category.label}</p>
                <p className="text-text-muted text-sm">{scale.label}</p>
                <p className="text-text-muted text-xs mt-2">
                  {scale.high} = 10 · {scale.low} = 1
                </p>
              </div>
            </Card>
          )}

          {/* Custom category if assigned */}
          {hasCustom && customCategory && (
            <Card>
              <div className="text-center">
                <span className="text-2xl">✨</span>
                <p className="font-bold mt-1">{customCategory.label}</p>
                <p className="text-text-muted text-sm">
                  {getScale(customCategory.scaleId)?.label}
                </p>
              </div>
            </Card>
          )}

          {/* Clue input */}
          <div>
            <input
              type="text"
              placeholder="Enter your one-word clue..."
              value={clueText}
              onChange={(e) => setClueText(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-light text-center"
              autoFocus
            />
          </div>

          <Button
            accentColor={ACCENT}
            fullWidth
            size="lg"
            onClick={handleSubmit}
            disabled={!clueText.trim()}
            className={cn(!clueText.trim() && "opacity-50")}
          >
            Lock In Clue
          </Button>
        </div>
      </GameShell>
    </motion.div>
  );
}

// ── Guessing Phase ───────────────────────────────────────────────

function GuessingPhase({
  guesserName,
  players,
  guesserIndex,
  assignments,
  customCategory,
  clues,
  onGuess,
}: {
  guesserName: string;
  players: { id: number; name: string }[];
  guesserIndex: number;
  assignments: SpinAndGuessAssignment[];
  customCategory: { label: string; scaleId: string; playerIndex: number } | null;
  clues: Record<number, string>;
  onGuess: (guess: number) => void;
}) {
  const [showGuess, setShowGuess] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  if (!showGuess) {
    return (
      <PassScreen
        playerName={guesserName}
        onReady={() => setShowGuess(true)}
        accentColor={ACCENT}
      />
    );
  }

  return (
    <GameShell title="Spin & Guess" accentColor={ACCENT}>
      <div className="space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: ACCENT }}>
            {guesserName}, guess the number!
          </h2>
        </div>

        {/* Clues display */}
        <div className="space-y-2">
          {assignments.map((a) => {
            const player = players[a.playerIndex];
            const cat = allCategories.find((c) => c.id === a.categoryId);
            const clue = clues[a.playerIndex];
            return (
              <Card key={a.playerIndex}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span>{cat?.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-text-muted">{player?.name}</p>
                      <p className="text-xs text-text-muted">{cat?.label}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold" style={{ color: ACCENT }}>
                    {clue || "—"}
                  </p>
                </div>
              </Card>
            );
          })}

          {/* Custom category clue */}
          {customCategory && clues[customCategory.playerIndex] && (
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span>✨</span>
                  <div className="min-w-0">
                    <p className="text-xs text-text-muted">
                      {players[customCategory.playerIndex]?.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {customCategory.label}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold" style={{ color: ACCENT }}>
                  {clues[customCategory.playerIndex]}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Number picker */}
        <div>
          <p className="text-text-secondary text-sm mb-3 text-center">
            What number do you think it is?
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelected(n)}
                className={cn(
                  "h-12 rounded-xl border font-bold text-lg cursor-pointer transition-colors",
                  selected === n
                    ? "bg-[#06B6D420] border-[#06B6D4] text-white"
                    : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
                )}
              >
                {n}
              </motion.button>
            ))}
          </div>
        </div>

        <Button
          accentColor={ACCENT}
          fullWidth
          size="lg"
          onClick={() => selected !== null && onGuess(selected)}
          disabled={selected === null}
          className={cn(selected === null && "opacity-50")}
        >
          Lock In Guess
        </Button>
      </div>
    </GameShell>
  );
}

// ── Reveal Phase ─────────────────────────────────────────────────

function RevealPhase({
  players,
  state,
  onNextRound,
}: {
  players: { id: number; name: string }[];
  state: {
    secretNumber: number | null;
    guess: number | null;
    guesserIndex: number;
    roundNumber: number;
    totalRounds: number;
    scores: Record<number, number>;
  };
  onNextRound: () => void;
}) {
  const diff = Math.abs((state.guess ?? 0) - (state.secretNumber ?? 0));
  const score =
    diff === 0 ? 10 : diff === 1 ? 7 : diff === 2 ? 4 : diff === 3 ? 1 : 0;
  const isExact = diff === 0;
  const isClose = diff <= 2;
  const guesser = players[state.guesserIndex];
  const isLastRound = state.roundNumber >= state.totalRounds;

  useEffect(() => {
    if (isExact) {
      fireConfetti(["#06B6D4", "#10B981", "#FFFFFF"]);
    }
  }, [isExact]);

  return (
    <GameShell title="Spin & Guess" accentColor={ACCENT}>
      <div className="flex flex-col items-center text-center gap-5 pt-4">
        {/* Number reveal */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <p className="text-text-muted text-sm mb-1">The number was</p>
          <span
            className="text-7xl font-black block"
            style={{ color: ACCENT }}
          >
            {state.secretNumber}
          </span>
        </motion.div>

        {/* Guess comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface border border-border rounded-[var(--radius-card)] p-5 w-full"
        >
          <p className="text-text-muted text-sm mb-1">
            {guesser.name} guessed
          </p>
          <p className="text-4xl font-bold text-text-primary">
            {state.guess}
          </p>
          <p
            className={cn(
              "text-lg font-bold mt-2",
              isExact
                ? "text-success"
                : isClose
                  ? "text-warning"
                  : "text-danger"
            )}
          >
            {isExact
              ? "PERFECT!"
              : diff === 1
                ? "So close! Off by 1"
                : `Off by ${diff}`}
          </p>
          <p className="text-text-muted text-sm mt-1">+{score} points</p>
        </motion.div>

        {/* Current scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full"
        >
          <p className="text-text-muted text-sm mb-2">Scores</p>
          <div className="space-y-1.5">
            {players
              .map((p, i) => ({
                player: p,
                score:
                  (state.scores[i] || 0) +
                  (i === state.guesserIndex ? score : 0),
              }))
              .sort((a, b) => b.score - a.score)
              .map(({ player, score: s }) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-surface rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-text-secondary">
                    {player.name}
                  </span>
                  <span className="font-bold text-sm" style={{ color: ACCENT }}>
                    {s}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>

        <Button accentColor={ACCENT} fullWidth size="lg" onClick={onNextRound}>
          {isLastRound ? "See Final Results" : "Next Round"}
        </Button>
      </div>
    </GameShell>
  );
}

// ── End Screen ───────────────────────────────────────────────────

function EndScreen({
  players,
  scores,
  roundHistory,
  onPlayAgain,
  onNewGame,
  onHome,
}: {
  players: { id: number; name: string }[];
  scores: Record<number, number>;
  roundHistory: SpinAndGuessRound[];
  onPlayAgain: () => void;
  onNewGame: () => void;
  onHome: () => void;
}) {
  useEffect(() => {
    fireWinConfetti();
  }, []);

  // Sort players by score descending
  const leaderboard = players
    .map((p, i) => ({ player: p, index: i, score: scores[i] || 0 }))
    .sort((a, b) => b.score - a.score);

  const winner = leaderboard[0];

  // Fun stats
  const perfectRounds = roundHistory.filter((r) => r.score === 10).length;
  const totalRounds = roundHistory.length;
  const avgDiff =
    totalRounds > 0
      ? (
          roundHistory.reduce(
            (sum, r) => sum + Math.abs(r.guess - r.secretNumber),
            0
          ) / totalRounds
        ).toFixed(1)
      : "0";

  // Best guesser: player with highest score
  const bestGuesser = winner;

  // Worst guess: round with biggest diff
  const worstRound = roundHistory.reduce(
    (worst, r) =>
      Math.abs(r.guess - r.secretNumber) >
      Math.abs((worst?.guess ?? 0) - (worst?.secretNumber ?? 0))
        ? r
        : worst,
    roundHistory[0]
  );

  return (
    <GameShell title="Spin & Guess" accentColor={ACCENT}>
      <ResultsScreen
        title="Game Over!"
        accentColor={ACCENT}
        onPlayAgain={onPlayAgain}
        onNewGame={onNewGame}
        onHome={onHome}
      >
        <div className="space-y-5 w-full">
          {/* Winner */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="text-center"
          >
            <p className="text-5xl mb-2">🏆</p>
            <h2 className="text-2xl font-black" style={{ color: ACCENT }}>
              {winner.player.name}
            </h2>
            <p className="text-text-secondary">wins with {winner.score} points!</p>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-4"
          >
            <p className="text-text-muted text-sm mb-3">Final Standings</p>
            <div className="space-y-2">
              {leaderboard.map((entry, rank) => (
                <div
                  key={entry.player.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg w-7">
                      {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}.`}
                    </span>
                    <span className="font-medium text-text-primary text-sm">
                      {entry.player.name}
                    </span>
                  </div>
                  <span
                    className="font-bold text-sm"
                    style={{ color: ACCENT }}
                  >
                    {entry.score} pts
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Fun stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-4"
          >
            <p className="text-text-muted text-sm mb-3">Game Stats</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: ACCENT }}>
                  {perfectRounds}
                </p>
                <p className="text-text-muted text-xs">Perfect Guesses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: ACCENT }}>
                  {avgDiff}
                </p>
                <p className="text-text-muted text-xs">Avg. Off By</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: ACCENT }}>
                  {totalRounds}
                </p>
                <p className="text-text-muted text-xs">Rounds Played</p>
              </div>
              {worstRound && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-danger">
                    {Math.abs(worstRound.guess - worstRound.secretNumber)}
                  </p>
                  <p className="text-text-muted text-xs">Biggest Miss</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </ResultsScreen>
    </GameShell>
  );
}
