"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { staggerContainer, fadeSlideUp, popSpring } from "@/lib/animations";

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
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer(0.12)}
      initial={prefersReduced ? { opacity: 1 } : "hidden"}
      animate={prefersReduced ? { opacity: 1 } : "visible"}
      className="flex flex-col items-center text-center space-y-6 p-6"
    >
      <motion.h1
        variants={prefersReduced ? undefined : fadeSlideUp}
        initial={prefersReduced ? undefined : { opacity: 0, y: 20, scale: 0.8 }}
        animate={prefersReduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={prefersReduced ? undefined : popSpring}
        className="text-3xl font-bold"
      >
        {title}
      </motion.h1>

      {subtitle && (
        <motion.p
          variants={prefersReduced ? undefined : fadeSlideUp}
          className="text-text-secondary text-lg"
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div variants={prefersReduced ? undefined : fadeSlideUp} className="w-full">
        {children}
      </motion.div>

      <motion.div variants={prefersReduced ? undefined : fadeSlideUp} className="w-full space-y-3 pt-4">
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
      </motion.div>
    </motion.div>
  );
}
