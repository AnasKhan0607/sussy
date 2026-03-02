"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const games = [
  {
    id: "imposter",
    emoji: "\ud83d\udd75\ufe0f",
    name: "The Imposter",
    tagline: "Find the fake",
    players: "3\u201320",
    color: "#8B5CF6",
    featured: true,
  },
  {
    id: "hot-takes",
    emoji: "\ud83d\udd25",
    name: "Hot Takes",
    tagline: "Who's most likely to...",
    players: "3\u201315",
    color: "#F59E0B",
    featured: false,
  },
  {
    id: "spin-and-guess",
    emoji: "\ud83c\udfaf",
    name: "Spin & Guess",
    tagline: "Spin, clue, guess the number",
    players: "3\u201310",
    color: "#06B6D4",
    featured: false,
  },
];

const comingSoon = [
  { emoji: "\ud83c\udfad", name: "Bluff Master", color: "#EC4899" },
  { emoji: "\u26a1", name: "Rapid Fire", color: "#F97316" },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-dvh pb-12">
      <HomeHeader />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-4 space-y-4 max-w-lg mx-auto"
      >
        {games.map((game) => (
          <motion.div key={game.id} variants={itemVariants}>
            <Card
              hoverable
              glowColor={game.color}
              onClick={() => router.push(`/${game.id}`)}
              className={game.featured ? "py-8" : ""}
            >
              <div className="flex items-center gap-4">
                <span className={game.featured ? "text-5xl" : "text-3xl"}>
                  {game.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <h2
                    className={`font-bold ${game.featured ? "text-2xl" : "text-xl"}`}
                  >
                    {game.name}
                  </h2>
                  <p className="text-text-secondary text-sm">{game.tagline}</p>
                </div>
                <Badge color={game.color}>{game.players}</Badge>
              </div>
              <div
                className="mt-4 h-1 rounded-full"
                style={{ backgroundColor: game.color }}
              />
            </Card>
          </motion.div>
        ))}

        {/* Coming soon */}
        {comingSoon.map((game) => (
          <motion.div key={game.name} variants={itemVariants}>
            <Card className="opacity-40">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{game.emoji}</span>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{game.name}</h2>
                  <p className="text-text-muted text-sm">Coming soon</p>
                </div>
                <Badge color={game.color}>{"\ud83d\udd12"}</Badge>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
