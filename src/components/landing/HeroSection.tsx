"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const orbKeyframes = [
  { x: [0, 120, -80, 0], y: [0, -60, 100, 0] },
  { x: [0, -100, 60, 0], y: [0, 80, -40, 0] },
  { x: [0, 60, -120, 0], y: [0, -100, 40, 0] },
];

const orbColors = [
  "from-[#8B5CF6] to-[#7C3AED]", // purple
  "from-[#F59E0B] to-[#D97706]", // amber
  "from-[#06B6D4] to-[#0891B2]", // cyan
];

interface HeroSectionProps {
  onPlayNow: () => void;
}

export function HeroSection({ onPlayNow }: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-8 overflow-hidden">
      {/* Floating gradient orbs */}
      {orbColors.map((color, i) => (
        <motion.div
          key={i}
          className={`absolute w-72 h-72 rounded-full bg-gradient-to-br ${color} opacity-15 blur-3xl`}
          animate={orbKeyframes[i]}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          style={{
            top: `${20 + i * 20}%`,
            left: `${15 + i * 25}%`,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-3xl"
      >
        <h1
          className="text-7xl md:text-8xl font-black tracking-tight text-brand mb-6"
          style={{ textShadow: "0 0 60px rgba(139, 92, 246, 0.4)" }}
        >
          SUSSY
        </h1>
        <p className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
          One Phone. All the Games.
        </p>
        <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10">
          The party game app that needs zero setup. No downloads, no accounts,
          no extra devices. Just pass the phone and play.
        </p>
        <Button
          accentColor="#8B5CF6"
          size="lg"
          onClick={onPlayNow}
          className="text-xl px-12 py-5"
        >
          Play Now
        </Button>
      </motion.div>
    </section>
  );
}
