"use client";

import { motion } from "framer-motion";

export function HomeHeader() {
  return (
    <header className="text-center pt-12 pb-6 px-4">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-black tracking-tight text-brand"
        style={{
          textShadow: "0 0 40px rgba(139, 92, 246, 0.3)",
        }}
      >
        SUSSY
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-text-secondary mt-2 text-lg"
      >
        One phone. All the games.
      </motion.p>
    </header>
  );
}
