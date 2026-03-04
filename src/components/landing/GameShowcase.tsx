"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { PhoneFrame } from "./PhoneFrame";
import { games, type Game } from "@/data/games";

function GamePreview({ game }: { game: Game }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-bg-secondary">
      <span className="text-6xl mb-4">{game.emoji}</span>
      <h3 className="text-lg font-bold text-text-primary mb-1">{game.name}</h3>
      <p className="text-xs text-text-secondary text-center">{game.tagline}</p>
      <div
        className="mt-4 w-16 h-1 rounded-full"
        style={{ backgroundColor: game.color }}
      />
    </div>
  );
}

export function GameShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const cardWidth = 280; // 240px phone + 40px gap
  const totalWidth = cardWidth * games.length;

  function snapTo(index: number) {
    const clamped = Math.max(0, Math.min(index, games.length - 1));
    setActiveIndex(clamped);
    animate(x, -clamped * cardWidth, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
  }

  function resetAutoScroll() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % games.length;
        snapTo(next);
        return next;
      });
    }, 4000);
  }

  useEffect(() => {
    resetAutoScroll();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDragEnd(
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) {
    const swipe = info.offset.x + info.velocity.x * 0.2;
    if (swipe < -50) snapTo(activeIndex + 1);
    else if (swipe > 50) snapTo(activeIndex - 1);
    else snapTo(activeIndex);
    resetAutoScroll();
  }

  return (
    <section className="py-24 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-text-primary mb-3">
          Three Games, Infinite Fun
        </h2>
        <p className="text-text-secondary">
          Swipe to preview each game mode
        </p>
      </motion.div>

      <div ref={containerRef} className="flex justify-center">
        <div className="overflow-hidden" style={{ maxWidth: "100vw" }}>
          <motion.div
            className="flex gap-10 px-[calc(50vw-120px)] cursor-grab active:cursor-grabbing"
            drag="x"
            style={{ x }}
            dragConstraints={{
              left: -(totalWidth - cardWidth),
              right: 0,
            }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {games.map((game, i) => (
              <motion.div
                key={game.id}
                className="flex flex-col items-center gap-4"
                animate={{ scale: activeIndex === i ? 1 : 0.9, opacity: activeIndex === i ? 1 : 0.5 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <PhoneFrame>
                  <GamePreview game={game} />
                </PhoneFrame>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: game.color }}
                  />
                  <span className="text-sm font-medium text-text-primary">
                    {game.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-8">
        {games.map((game, i) => (
          <button
            key={game.id}
            onClick={() => {
              snapTo(i);
              resetAutoScroll();
            }}
            className="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
            style={{
              backgroundColor: activeIndex === i ? game.color : "rgba(255,255,255,0.2)",
              transform: activeIndex === i ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
