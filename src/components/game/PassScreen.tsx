"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { vibrateShort } from "@/lib/haptics";

interface PassScreenProps {
  playerName: string;
  onReady: () => void;
  accentColor?: string;
}

export function PassScreen({
  playerName,
  onReady,
  accentColor = "var(--color-brand)",
}: PassScreenProps) {
  const handleReady = () => {
    vibrateShort();
    onReady();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-bg-primary flex flex-col items-center justify-center p-8 z-50"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl mb-8"
      >
        📱
      </motion.div>

      <p className="text-text-secondary text-lg mb-2">Pass the phone to</p>

      <motion.h1
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="text-4xl font-bold text-text-primary mb-12 text-center"
      >
        {playerName}
      </motion.h1>

      <Button
        accentColor={accentColor}
        size="lg"
        fullWidth
        onClick={handleReady}
        className="max-w-xs"
      >
        I&apos;m ready
      </Button>
    </motion.div>
  );
}
