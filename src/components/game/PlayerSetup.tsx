"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PlayerSetupProps {
  minPlayers: number;
  maxPlayers: number;
  requireNames?: boolean;
  accentColor?: string;
  onStart: (count: number, names: string[]) => void;
}

export function PlayerSetup({
  minPlayers,
  maxPlayers,
  requireNames = false,
  accentColor = "var(--color-brand)",
  onStart,
}: PlayerSetupProps) {
  const [count, setCount] = useState(Math.max(minPlayers, 4));
  const [showNames, setShowNames] = useState(requireNames);
  const [names, setNames] = useState<string[]>([]);

  const handleCountChange = (delta: number) => {
    setCount((prev) => Math.min(maxPlayers, Math.max(minPlayers, prev + delta)));
  };

  const handleNameChange = (index: number, name: string) => {
    setNames((prev) => {
      const updated = [...prev];
      updated[index] = name;
      return updated;
    });
  };

  const handleStart = () => {
    const playerNames = showNames
      ? Array.from({ length: count }, (_, i) => {
          const raw = names[i] || "";
          // Trim, cap at 50 chars, strip control characters
          const sanitized = raw.trim().slice(0, 50).replace(/[\x00-\x1F\x7F]/g, "");
          return sanitized || `Player ${i + 1}`;
        })
      : [];
    onStart(count, playerNames);
  };

  return (
    <div className="space-y-8">
      {/* Player count stepper */}
      <div className="text-center space-y-4">
        <p className="text-text-secondary text-lg">How many players?</p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => handleCountChange(-1)}
            disabled={count <= minPlayers}
            className={cn(
              "w-12 h-12 rounded-full bg-surface border border-border text-2xl font-bold flex items-center justify-center cursor-pointer",
              count <= minPlayers ? "opacity-30" : "hover:bg-surface-hover"
            )}
          >
            -
          </button>
          <motion.span
            key={count}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-5xl font-bold min-w-[80px] text-center"
            style={{ color: accentColor }}
          >
            {count}
          </motion.span>
          <button
            onClick={() => handleCountChange(1)}
            disabled={count >= maxPlayers}
            className={cn(
              "w-12 h-12 rounded-full bg-surface border border-border text-2xl font-bold flex items-center justify-center cursor-pointer",
              count >= maxPlayers ? "opacity-30" : "hover:bg-surface-hover"
            )}
          >
            +
          </button>
        </div>
        <p className="text-text-muted text-sm">
          {minPlayers}–{maxPlayers} players
        </p>
      </div>

      {/* Optional names */}
      {!requireNames && (
        <button
          onClick={() => setShowNames(!showNames)}
          className="text-sm underline cursor-pointer mx-auto block"
          style={{ color: accentColor }}
        >
          {showNames ? "Skip player names" : "Add player names"}
        </button>
      )}

      {showNames && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="space-y-3 overflow-hidden"
        >
          {Array.from({ length: count }, (_, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Player ${i + 1}`}
              value={names[i] || ""}
              maxLength={50}
              onChange={(e) => handleNameChange(i, e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-light"
            />
          ))}
        </motion.div>
      )}

      <Button
        accentColor={accentColor}
        fullWidth
        size="lg"
        onClick={handleStart}
      >
        Start Game
      </Button>
    </div>
  );
}
