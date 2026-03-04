"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HeroSection } from "./HeroSection";
import { GameShowcase } from "./GameShowcase";
import { FeaturesGrid } from "./FeaturesGrid";
import { ComparisonTable } from "./ComparisonTable";
import { FooterCTA } from "./FooterCTA";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { games, comingSoon } from "@/data/games";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function LandingPage() {
  const router = useRouter();
  const gamesRef = useRef<HTMLDivElement>(null);

  function scrollToGames() {
    gamesRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-dvh">
      <HeroSection onPlayNow={scrollToGames} />
      <GameShowcase />
      <FeaturesGrid />
      <ComparisonTable />
      <FooterCTA onPlayNow={scrollToGames} />

      {/* Embedded game selector */}
      <section ref={gamesRef} className="py-24 px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            Choose Your Game
          </h2>
          <p className="text-text-secondary">
            Pick a game and start playing instantly
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {games.map((game) => (
            <motion.div key={game.id} variants={itemVariants}>
              <Card
                hoverable
                glowColor={game.color}
                onClick={() => router.push(`/${game.id}`)}
                className="h-full text-center p-8"
              >
                <span className="text-5xl block mb-4">{game.emoji}</span>
                <h3 className="text-xl font-bold mb-1">{game.name}</h3>
                <p className="text-text-secondary text-sm mb-3">
                  {game.description}
                </p>
                <Badge color={game.color}>{game.players} players</Badge>
                <div
                  className="mt-4 h-1 rounded-full mx-auto w-16"
                  style={{ backgroundColor: game.color }}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Coming soon */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex justify-center gap-4 mt-8"
        >
          {comingSoon.map((game) => (
            <motion.div key={game.name} variants={itemVariants}>
              <Card className="opacity-40 px-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{game.emoji}</span>
                  <span className="font-medium text-sm">{game.name}</span>
                  <Badge color={game.color}>{"\ud83d\udd12"}</Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
