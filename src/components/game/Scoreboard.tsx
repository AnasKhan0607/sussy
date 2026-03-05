"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/game/AnimatedNumber";
import { Player } from "@/lib/store";

interface ScoreboardProps {
  players: Player[];
  accentColor?: string;
}

export function Scoreboard({ players, accentColor = "var(--color-brand)" }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;

  return (
    <div className="space-y-2">
      {sorted.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border"
        >
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-sm w-6">{index + 1}.</span>
            <span
              className="font-semibold"
              style={
                player.score === topScore && topScore > 0
                  ? { color: accentColor }
                  : undefined
              }
            >
              {player.name}
            </span>
          </div>
          <span className="font-bold text-lg" style={{ color: accentColor }}>
            <AnimatedNumber
              value={player.score}
              duration={0.8}
              delay={index * 0.1}
            />
          </span>
        </motion.div>
      ))}
    </div>
  );
}
