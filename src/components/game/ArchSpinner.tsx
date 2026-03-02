"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { vibrateMedium, vibrateLong } from "@/lib/haptics";

interface ArchSpinnerProps {
  onResult: (n: number) => void;
  accentColor?: string;
  disabled?: boolean;
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SEGMENTS = NUMBERS.length;
const ARC_DEGREES = 180;
const SEGMENT_ANGLE = ARC_DEGREES / SEGMENTS;

// SVG dimensions
const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2 + 20; // shift center down so arch is higher
const R_OUTER = 140;
const R_INNER = 90;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number
) {
  const outerStart = polarToCartesian(cx, cy, rOuter, startDeg);
  const outerEnd = polarToCartesian(cx, cy, rOuter, endDeg);
  const innerStart = polarToCartesian(cx, cy, rInner, endDeg);
  const innerEnd = polarToCartesian(cx, cy, rInner, startDeg);

  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function getSegmentColor(index: number) {
  const colors = [
    "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
    "#EC4899", "#06B6D4", "#F97316", "#84CC16", "#6366F1",
  ];
  return colors[index % colors.length];
}

export function ArchSpinner({
  onResult,
  accentColor = "#06B6D4",
  disabled = false,
}: ArchSpinnerProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const spin = useCallback(() => {
    if (spinning || disabled) return;

    vibrateMedium();
    setSpinning(true);
    setResult(null);

    // Pick a random target number 1-10
    const target = Math.floor(Math.random() * 10) + 1;

    // Calculate rotation to land on target segment
    // Segments go left to right: 1 at far-left of arch, 10 at far-right
    // The pointer is at the top center (180° or index 0 position)
    // We need to rotate the arch so the target segment aligns with the pointer
    const targetIndex = target - 1;
    const segmentCenter = 180 + targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

    // Add multiple full rotations for visual effect
    const extraRotations = 3 + Math.floor(Math.random() * 3); // 3-5 full spins
    const totalRotation = extraRotations * 360 + segmentCenter;

    setRotation((prev) => prev + totalRotation);

    // Result after animation completes
    setTimeout(() => {
      vibrateLong();
      setSpinning(false);
      setResult(target);
      onResultRef.current(target);
    }, 3200);
  }, [spinning, disabled]);

  // The arch is drawn from 180° to 360° (bottom-left to bottom-right going over the top)
  // With the rotation origin at center, we rotate the whole arch group
  const startAngle = 180;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE / 2 + 60 }}>
        {/* Pointer at top center */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{ top: CY - R_OUTER - 18 }}
        >
          <svg width="24" height="20" viewBox="0 0 24 20">
            <path
              d="M12 20L2 2h20L12 20z"
              fill={accentColor}
              stroke="#0A0A1A"
              strokeWidth="2"
            />
          </svg>
        </div>

        <svg
          width={SIZE}
          height={SIZE / 2 + 60}
          viewBox={`0 0 ${SIZE} ${SIZE / 2 + 60}`}
        >
          <motion.g
            animate={{ rotate: rotation }}
            transition={{
              duration: 3,
              ease: [0.2, 0.8, 0.3, 1], // fast start, slow ease-out
            }}
            style={{ originX: `${CX}px`, originY: `${CY}px` }}
          >
            {NUMBERS.map((n, i) => {
              const segStart = startAngle + i * SEGMENT_ANGLE;
              const segEnd = segStart + SEGMENT_ANGLE;
              const midAngle = segStart + SEGMENT_ANGLE / 2;
              const labelR = (R_OUTER + R_INNER) / 2;
              const labelPos = polarToCartesian(CX, CY, labelR, midAngle);

              return (
                <g key={n}>
                  <path
                    d={arcPath(CX, CY, R_OUTER, R_INNER, segStart, segEnd)}
                    fill={getSegmentColor(i)}
                    stroke="#0A0A1A"
                    strokeWidth="2"
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontWeight="bold"
                    fontSize="18"
                  >
                    {n}
                  </text>
                </g>
              );
            })}
          </motion.g>
        </svg>

        {/* Result display */}
        {result !== null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-0"
          >
            <span
              className="text-5xl font-black"
              style={{ color: accentColor }}
            >
              {result}
            </span>
          </motion.div>
        )}
      </div>

      {/* Spin button */}
      {!spinning && result === null && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={spin}
          disabled={disabled}
          className="px-8 py-4 rounded-full font-bold text-lg text-white cursor-pointer min-h-[48px]"
          style={{ backgroundColor: accentColor }}
        >
          🎯 Spin!
        </motion.button>
      )}

      {spinning && (
        <p className="text-text-muted text-sm animate-pulse">Spinning...</p>
      )}
    </div>
  );
}
