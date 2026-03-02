"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  accentColor?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "text-white font-bold shadow-lg",
  secondary:
    "bg-surface text-text-primary border border-border-light hover:bg-surface-hover font-semibold",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary font-medium",
  danger: "bg-danger text-white font-bold",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-3 text-base rounded-[var(--radius-button)]",
  lg: "px-8 py-4 text-lg rounded-[var(--radius-button)] min-h-[48px]",
};

export function Button({
  variant = "primary",
  size = "lg",
  accentColor,
  fullWidth = false,
  className,
  children,
  style,
  ...props
}: ButtonProps) {
  const bgStyle =
    variant === "primary" && accentColor
      ? { background: accentColor, ...style }
      : style;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "cursor-pointer transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        !accentColor && variant === "primary" && "bg-brand",
        className
      )}
      style={bgStyle}
      {...props}
    >
      {children}
    </motion.button>
  );
}
