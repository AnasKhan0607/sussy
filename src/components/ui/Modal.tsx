"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={prefersReduced ? undefined : { type: "spring", duration: 0.3 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-surface border border-border rounded-[var(--radius-card)] p-6 max-w-md mx-auto"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
