"use client";

import { useEffect, useRef } from "react";
import { useSpring, useTransform, motion, useMotionValue } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  delay = 0,
  className,
}: AnimatedNumberProps) {
  const prefersReduced = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: prefersReduced ? 0 : duration * 1000,
    bounce: 0,
  });
  const display = useTransform(spring, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReduced) {
      motionValue.set(value);
      return;
    }
    const timeout = setTimeout(() => motionValue.set(value), delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay, motionValue, prefersReduced]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
    return unsubscribe;
  }, [display]);

  return (
    <motion.span ref={ref} className={className}>
      {prefersReduced ? value : 0}
    </motion.span>
  );
}
