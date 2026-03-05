"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CardProps extends HTMLMotionProps<"div"> {
  glowColor?: string;
  hoverable?: boolean;
}

export function Card({
  glowColor,
  hoverable = false,
  className,
  children,
  style,
  ...props
}: CardProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      whileTap={hoverable && !prefersReduced ? { scale: 0.98 } : undefined}
      whileHover={hoverable && !prefersReduced ? { scale: 1.02 } : undefined}
      className={cn(
        "bg-surface border border-border rounded-[var(--radius-card)] p-5",
        hoverable && "cursor-pointer",
        className
      )}
      style={{
        boxShadow: glowColor
          ? `0 0 20px ${glowColor}20, 0 0 40px ${glowColor}10`
          : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
