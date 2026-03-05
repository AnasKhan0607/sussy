"use client";

import { motion } from "framer-motion";
import { useTimer } from "@/hooks/useTimer";
import { useEffect } from "react";
import { vibrateLong } from "@/lib/haptics";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CountdownTimerProps {
  duration: number;
  onComplete: () => void;
  autoStart?: boolean;
  size?: number;
}

export function CountdownTimer({
  duration,
  onComplete,
  autoStart = true,
  size = 200,
}: CountdownTimerProps) {
  const prefersReduced = useReducedMotion();
  const { timeLeft, progress, start } = useTimer({
    duration,
    onComplete: () => {
      vibrateLong();
      onComplete();
    },
    autoStart,
  });

  useEffect(() => {
    if (autoStart) start();
  }, [autoStart, start]);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (progress > 0.5) return "#10B981";
    if (progress > 0.2) return "#F59E0B";
    return "#EF4444";
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A1A2E"
          strokeWidth={8}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transition={{ duration: 0.5 }}
        />
      </svg>

      <motion.span
        key={timeLeft}
        initial={{ scale: 1.1 }}
        animate={{
          scale: prefersReduced
            ? 1
            : timeLeft <= 10
              ? [1, 1.1, 1]
              : timeLeft <= 30
                ? [1, 1.05, 1]
                : 1,
        }}
        transition={
          prefersReduced
            ? undefined
            : timeLeft <= 10
              ? { duration: 0.8, repeat: Infinity }
              : timeLeft <= 30
                ? { duration: 1.2, repeat: Infinity }
                : undefined
        }
        className="absolute text-5xl font-bold"
        style={{ color: getColor() }}
      >
        {display}
      </motion.span>
    </div>
  );
}
