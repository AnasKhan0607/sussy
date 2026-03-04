"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface FooterCTAProps {
  onPlayNow: () => void;
}

export function FooterCTA({ onPlayNow }: FooterCTAProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-24 px-8 text-center"
    >
      <p className="text-text-secondary text-lg mb-6">
        Ready to get the party started?
      </p>
      <Button
        accentColor="#8B5CF6"
        size="lg"
        onClick={onPlayNow}
        className="text-xl px-12 py-5"
      >
        Play Now
      </Button>
      <p className="text-text-muted text-sm mt-4">
        Free forever. No downloads required.
      </p>
    </motion.section>
  );
}
