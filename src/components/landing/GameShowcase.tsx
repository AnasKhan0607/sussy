"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, animate, useTransform } from "framer-motion";
import Image from "next/image";
import { PhoneFrame } from "./PhoneFrame";
import { games, type Game } from "@/data/games";

const ANGLE_PER_CARD = 360 / games.length;
const RADIUS = 300;
const AUTO_ROTATE_MS = 4000;

function GamePreview({ game }: { game: Game }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-bg-secondary">
      {game.icon ? (
        <Image
          src={game.icon}
          alt={game.name}
          width={120}
          height={120}
          className="object-contain mb-4"
        />
      ) : (
        <span className="text-6xl mb-4">{game.emoji}</span>
      )}
      <h3 className="text-lg font-bold text-text-primary mb-1">{game.name}</h3>
      <p className="text-xs text-text-secondary text-center">{game.tagline}</p>
      <div
        className="mt-4 w-16 h-1 rounded-full"
        style={{ backgroundColor: game.color }}
      />
    </div>
  );
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

function getActiveIndex(angle: number) {
  const normalized = normalizeAngle(-angle);
  return Math.round(normalized / ANGLE_PER_CARD) % games.length;
}

/** Individual card that computes its own position from the carousel rotation */
function CarouselCard({
  game,
  index,
  carouselAngle,
}: {
  game: Game;
  index: number;
  carouselAngle: ReturnType<typeof useSpring>;
}) {
  const cardBaseAngle = index * ANGLE_PER_CARD;

  // Compute this card's effective angle relative to the viewer (0 = front)
  const cardAngle = useTransform(carouselAngle, (rot) => {
    const effective = normalizeAngle(cardBaseAngle + rot);
    return effective > 180 ? effective - 360 : effective;
  });

  // Convert angle to x position (sin curve)
  const x = useTransform(cardAngle, (a) => Math.sin((a * Math.PI) / 180) * RADIUS);

  // Convert angle to z-depth for scale + opacity
  const z = useTransform(cardAngle, (a) => Math.cos((a * Math.PI) / 180));

  // Scale: front = 1, sides = 0.75, back = 0.6
  const scale = useTransform(z, [-1, 0, 1], [0.6, 0.75, 1]);

  // Opacity: front = 1, sides = 0.5, back = 0.3
  const opacity = useTransform(z, [-1, 0, 1], [0.3, 0.5, 1]);

  // z-index: front cards on top
  const zIndex = useTransform(z, (zVal) => Math.round((zVal + 1) * 50));

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-4"
      style={{
        x,
        scale,
        opacity,
        zIndex,
        // Center the card in the container
        left: "50%",
        marginLeft: -120, // half of 240px phone width
      }}
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
  );
}

export function GameShowcase() {
  const rotation = useMotionValue(0);
  const smoothRotation = useSpring(rotation, { stiffness: 200, damping: 30 });
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartAngle = useRef(0);

  const snapTo = useCallback(
    (index: number) => {
      const target = -(index * ANGLE_PER_CARD);
      const current = rotation.get();
      const diff = ((target - current) % 360 + 540) % 360 - 180;
      animate(rotation, current + diff, {
        type: "spring",
        stiffness: 200,
        damping: 30,
      });
      setActiveIndex(index);
    },
    [rotation]
  );

  const resetAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % games.length;
        snapTo(next);
        return next;
      });
    }, AUTO_ROTATE_MS);
  }, [snapTo]);

  useEffect(() => {
    resetAutoScroll();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetAutoScroll]);

  useEffect(() => {
    const unsubscribe = smoothRotation.on("change", (v) => {
      if (!isDragging.current) {
        setActiveIndex(getActiveIndex(v));
      }
    });
    return unsubscribe;
  }, [smoothRotation]);

  function handlePointerDown(e: React.PointerEvent) {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartAngle.current = rotation.get();
    if (intervalRef.current) clearInterval(intervalRef.current);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    const newAngle = dragStartAngle.current + dx * 0.3;
    rotation.set(newAngle);
    setActiveIndex(getActiveIndex(newAngle));
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = e.clientX - dragStartX.current;
    const newAngle = dragStartAngle.current + dx * 0.3;
    const nearestIndex = getActiveIndex(newAngle);
    snapTo(nearestIndex);
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
          Drag to spin the carousel
        </p>
      </motion.div>

      <div
        className="relative mx-auto cursor-grab active:cursor-grabbing select-none"
        style={{ height: 560, maxWidth: 900 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {games.map((game, i) => (
          <CarouselCard
            key={game.id}
            game={game}
            index={i}
            carouselAngle={smoothRotation}
          />
        ))}
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
              backgroundColor:
                activeIndex === i ? game.color : "rgba(255,255,255,0.2)",
              transform: activeIndex === i ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
