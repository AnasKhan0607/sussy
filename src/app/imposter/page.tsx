"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell } from "@/components/layout/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGameStore, Player } from "@/lib/store";
import { categories } from "@/data/imposter";
import { assignImposterRoles, pickWord } from "@/lib/gameEngine";
import { cn } from "@/lib/utils";

const ACCENT = "#8B5CF6";

const TIMER_OPTIONS: { label: string; value: number | null }[] = [
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
  { label: "No limit", value: null },
];

const DIFFICULTY_OPTIONS: {
  label: string;
  value: "easy" | "medium" | "hard" | "mixed";
}[] = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" },
  { label: "Mixed", value: "mixed" },
];

export default function ImposterSetup() {
  const router = useRouter();
  const { imposterState, updateImposterState, setPlayers, setCurrentGame } =
    useGameStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [playerCount, setPlayerCount] = useState(4);
  const [imposterCount, setImposterCount] = useState(imposterState.imposterCount);
  const [difficulty, setDifficulty] = useState(imposterState.difficulty);
  const [timerDuration, setTimerDuration] = useState<number | null>(
    imposterState.timerDuration
  );
  const [enableTimer, setEnableTimer] = useState(imposterState.enableTimer);
  const [enableVoting, setEnableVoting] = useState(imposterState.enableVoting);
  const [showCategoryToImposter, setShowCategoryToImposter] = useState(
    imposterState.showCategoryToImposter
  );
  const [showHintToImposter, setShowHintToImposter] = useState(
    imposterState.showHintToImposter
  );
  const [showAdvanced, setShowAdvanced] = useState(
    imposterState.enableTimer || imposterState.enableVoting
  );
  const [showNames, setShowNames] = useState(false);
  const [names, setNames] = useState<string[]>([]);

  const maxImposters = Math.floor(playerCount / 2);

  const handlePlayerChange = (delta: number) => {
    const next = Math.min(12, Math.max(3, playerCount + delta));
    setPlayerCount(next);
    // Clamp imposter count if needed
    const newMax = Math.floor(next / 2);
    if (imposterCount > newMax) setImposterCount(Math.max(1, newMax));
  };

  const handleNameChange = (index: number, name: string) => {
    setNames((prev) => {
      const updated = [...prev];
      updated[index] = name;
      return updated;
    });
  };

  const handleStart = () => {
    const categoryData = categories.find((c) => c.category === selectedCategory);
    if (!categoryData) return;

    // Create players
    const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: showNames && names[i]?.trim() ? names[i].trim() : `Player ${i + 1}`,
      score: 0,
    }));

    // Pick word and assign roles
    const { word: secretWord, hint: secretHint } = pickWord(categoryData, difficulty);
    const imposterIndices = assignImposterRoles(playerCount, imposterCount);

    setPlayers(players);
    setCurrentGame("imposter");
    updateImposterState({
      category: selectedCategory,
      secretWord,
      secretHint,
      imposterIndices,
      imposterCount,
      difficulty,
      timerDuration,
      enableTimer,
      enableVoting,
      showCategoryToImposter,
      showHintToImposter,
      currentPlayerIndex: 0,
      phase: "assigning",
      votes: {},
    });

    router.push("/imposter/play");
  };

  const canStart = selectedCategory !== "";

  return (
    <GameShell title="The Imposter" accentColor={ACCENT}>
      <div className="space-y-8 pb-4">
        {/* Category picker */}
        <section>
          <h2 className="text-lg font-bold mb-3">Choose a Category</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.category;
              const isRandom = cat.category === "Random";
              return (
                <motion.button
                  key={cat.category}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedCategory(cat.category);
                    if (cat.category !== "Random") {
                      setShowCategoryToImposter(true);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius-card)] border cursor-pointer transition-colors",
                    isSelected
                      ? "bg-[#8B5CF620] border-[#8B5CF6]"
                      : isRandom
                        ? "bg-surface border-transparent hover:bg-surface-hover"
                        : "bg-surface border-border hover:bg-surface-hover"
                  )}
                  style={
                    isRandom && !isSelected
                      ? {
                          backgroundImage:
                            "linear-gradient(var(--color-surface), var(--color-surface)), linear-gradient(135deg, #8B5CF6, #06B6D4, #F59E0B)",
                          backgroundOrigin: "border-box",
                          backgroundClip: "padding-box, border-box",
                        }
                      : undefined
                  }
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span
                    className={cn(
                      "text-xs font-medium leading-tight text-center",
                      isSelected ? "text-white" : "text-text-secondary"
                    )}
                  >
                    {cat.category}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Player count */}
        <section>
          <h2 className="text-lg font-bold mb-3">Players</h2>
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">How many?</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePlayerChange(-1)}
                  disabled={playerCount <= 3}
                  className={cn(
                    "w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center cursor-pointer",
                    playerCount <= 3 ? "opacity-30" : "hover:bg-surface-hover"
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
                  disabled={playerCount >= 12}
                  className={cn(
                    "w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center cursor-pointer",
                    playerCount >= 12 ? "opacity-30" : "hover:bg-surface-hover"
                  )}
                >
                  +
                </button>
              </div>
            </div>

            {/* Name toggle */}
            <button
              onClick={() => setShowNames(!showNames)}
              className="text-sm underline cursor-pointer mt-3 block"
              style={{ color: ACCENT }}
            >
              {showNames ? "Skip player names" : "Add player names"}
            </button>

            {showNames && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="space-y-2 mt-3 overflow-hidden"
              >
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
              </motion.div>
            )}
          </Card>
        </section>

        {/* Imposter count */}
        <section>
          <h2 className="text-lg font-bold mb-3">Imposters</h2>
          <div className="flex gap-2.5">
            {[1, 2, 3].map((n) => {
              const disabled = n > maxImposters;
              const isSelected = imposterCount === n;
              return (
                <motion.button
                  key={n}
                  whileTap={disabled ? undefined : { scale: 0.95 }}
                  onClick={() => !disabled && setImposterCount(n)}
                  disabled={disabled}
                  className={cn(
                    "flex-1 py-3 rounded-[var(--radius-button)] border font-bold text-lg cursor-pointer transition-colors",
                    disabled && "opacity-30 cursor-not-allowed",
                    isSelected
                      ? "bg-[#8B5CF620] border-[#8B5CF6] text-white"
                      : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
                  )}
                >
                  {n}
                </motion.button>
              );
            })}
          </div>
          {maxImposters < 3 && (
            <p className="text-text-muted text-xs mt-2">
              Max {maxImposters} imposter{maxImposters !== 1 && "s"} with{" "}
              {playerCount} players
            </p>
          )}
        </section>

        {/* Difficulty */}
        <section>
          <h2 className="text-lg font-bold mb-3">Difficulty</h2>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => {
              const isSelected = difficulty === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty(opt.value)}
                  className={cn(
                    "flex-1 py-2.5 rounded-[var(--radius-button)] border text-sm font-semibold cursor-pointer transition-colors",
                    isSelected
                      ? "bg-[#8B5CF620] border-[#8B5CF6] text-white"
                      : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
                  )}
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Advanced Options */}
        <section>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-text-secondary cursor-pointer w-full"
          >
            <motion.span
              animate={{ rotate: showAdvanced ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm"
            >
              ▶
            </motion.span>
            <span className="text-sm font-semibold">Advanced Options</span>
          </button>

          <AnimatePresence initial={false}>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-4">
                  {/* Discussion Timer toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">
                        Discussion Timer
                      </span>
                      <ToggleSwitch
                        enabled={enableTimer}
                        onToggle={() => setEnableTimer(!enableTimer)}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Adds a countdown timer for the discussion phase
                    </p>
                    <AnimatePresence initial={false}>
                      {enableTimer && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2 flex-wrap mt-3">
                            {TIMER_OPTIONS.map((opt) => {
                              const isSelected = timerDuration === opt.value;
                              return (
                                <motion.button
                                  key={opt.label}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setTimerDuration(opt.value)}
                                  className={cn(
                                    "px-4 py-2.5 rounded-[var(--radius-button)] border text-sm font-semibold cursor-pointer transition-colors",
                                    isSelected
                                      ? "bg-[#8B5CF620] border-[#8B5CF6] text-white"
                                      : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
                                  )}
                                >
                                  {opt.label}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Digital Voting toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">
                        Digital Voting
                      </span>
                      <ToggleSwitch
                        enabled={enableVoting}
                        onToggle={() => setEnableVoting(!enableVoting)}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Vote through the phone instead of out loud
                    </p>
                  </div>

                  {/* Imposter Visibility */}
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Imposter Visibility
                    </p>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-primary">
                            Show Category
                          </span>
                          <ToggleSwitch
                            enabled={showCategoryToImposter}
                            onToggle={() =>
                              setShowCategoryToImposter(!showCategoryToImposter)
                            }
                            disabled={selectedCategory !== "Random"}
                          />
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                          {selectedCategory !== "Random"
                            ? "Always shown for themed categories"
                            : "Imposter sees the category name"}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-primary">
                            Show Hint
                          </span>
                          <ToggleSwitch
                            enabled={showHintToImposter}
                            onToggle={() =>
                              setShowHintToImposter(!showHintToImposter)
                            }
                          />
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                          Imposter gets a vague clue about the word
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Start button */}
        <Button
          accentColor={ACCENT}
          fullWidth
          size="lg"
          onClick={handleStart}
          disabled={!canStart}
          className={cn(!canStart && "opacity-50 cursor-not-allowed")}
        >
          🕵️ Start Game
        </Button>
      </div>
    </GameShell>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={cn(
        "relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        enabled ? "bg-[#8B5CF6]" : "bg-surface border border-border"
      )}
    >
      <motion.div
        className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
        animate={{ left: enabled ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
