"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { vibrateMedium } from "@/lib/haptics";

interface PrivacyRevealProps {
  content: React.ReactNode;
  autoHideDelay?: number;
  onDone: () => void;
  accentColor?: string;
}

export function PrivacyReveal({
  content,
  autoHideDelay = 5,
  onDone,
  accentColor = "var(--color-brand)",
}: PrivacyRevealProps) {
  const [revealed, setRevealed] = useState(false);

  const handleTap = useCallback(() => {
    if (!revealed) {
      vibrateMedium();
      setRevealed(true);
    } else {
      setRevealed(false);
      onDone();
    }
  }, [revealed, onDone]);

  useEffect(() => {
    if (revealed && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setRevealed(false);
        onDone();
      }, autoHideDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [revealed, autoHideDelay, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-bg-primary flex flex-col items-center justify-center p-8 z-50 cursor-pointer select-none"
      onClick={handleTap}
    >
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl text-text-secondary"
            >
              Tap to reveal your role
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="text-center w-full"
          >
            {content}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-sm"
              style={{ color: accentColor }}
            >
              Tap anywhere to hide
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
