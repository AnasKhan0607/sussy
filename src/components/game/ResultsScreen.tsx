"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface ResultsScreenProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  accentColor?: string;
  onPlayAgain: () => void;
  onNewGame: () => void;
  onHome: () => void;
}

export function ResultsScreen({
  title,
  subtitle,
  children,
  accentColor = "var(--color-brand)",
  onPlayAgain,
  onNewGame,
  onHome,
}: ResultsScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center space-y-6 p-6"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-3xl font-bold"
      >
        {title}
      </motion.h1>

      {subtitle && (
        <p className="text-text-secondary text-lg">{subtitle}</p>
      )}

      {children}

      <div className="w-full space-y-3 pt-4">
        <Button
          accentColor={accentColor}
          fullWidth
          size="lg"
          onClick={onPlayAgain}
        >
          Play Again
        </Button>
        <Button variant="secondary" fullWidth size="md" onClick={onNewGame}>
          New Game
        </Button>
        <Button variant="ghost" fullWidth size="md" onClick={onHome}>
          Home
        </Button>
      </div>
    </motion.div>
  );
}
