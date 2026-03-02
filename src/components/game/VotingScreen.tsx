"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Player } from "@/lib/store";
import { cn } from "@/lib/utils";

interface VotingScreenProps {
  voter: Player;
  players: Player[];
  excludeIds?: number[];
  accentColor?: string;
  onVote: (votedForId: number) => void;
}

export function VotingScreen({
  voter,
  players,
  excludeIds = [],
  accentColor = "var(--color-brand)",
  onVote,
}: VotingScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const votablePlayers = players.filter(
    (p) => p.id !== voter.id && !excludeIds.includes(p.id)
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-text-secondary text-sm">Voting as</p>
        <h2 className="text-2xl font-bold">{voter.name}</h2>
      </div>

      <div className="space-y-3">
        {votablePlayers.map((player) => (
          <motion.button
            key={player.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(player.id)}
            className={cn(
              "w-full p-4 rounded-xl border text-left text-lg font-semibold transition-colors cursor-pointer",
              selected === player.id
                ? "border-2"
                : "bg-surface border-border hover:bg-surface-hover"
            )}
            style={
              selected === player.id
                ? { borderColor: accentColor, backgroundColor: `${accentColor}15` }
                : undefined
            }
          >
            {player.name}
          </motion.button>
        ))}
      </div>

      <Button
        accentColor={accentColor}
        fullWidth
        size="lg"
        onClick={() => selected !== null && onVote(selected)}
        className={cn(selected === null && "opacity-50")}
        disabled={selected === null}
      >
        Lock In Vote
      </Button>
    </div>
  );
}
