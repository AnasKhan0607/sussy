"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

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
  return (
    <motion.div
      whileTap={hoverable ? { scale: 0.98 } : undefined}
      whileHover={hoverable ? { scale: 1.02 } : undefined}
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
