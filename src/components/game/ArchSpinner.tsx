"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
const SEGMENT_ANGLE = ARC_DEGREES / SEGMENTS; // 18° each

// SVG dimensions
const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2 + 20; // shift center down so arch is higher
const R_OUTER = 140;
const R_INNER = 90;

// Arch spans from 270° (left) through 360°/0° (top) to 90° (right)
// Using 270–450 so angles are contiguous
const ARCH_START = 270;
const ARCH_END = ARCH_START + ARC_DEGREES; // 450
const ARCH_MID = ARCH_START + ARC_DEGREES / 2; // 360 = top center

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
  const [pointerAngle, setPointerAngle] = useState(ARCH_MID); // top center
  const [result, setResult] = useState<number | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const animRef = useRef<number>(0);
  const pointerAngleRef = useRef(ARCH_MID);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const spin = useCallback(() => {
    if (spinning || disabled) return;

    vibrateMedium();
    setSpinning(true);
    setResult(null);

    // Pick a random target number 1-10
    const target = Math.floor(Math.random() * 10) + 1;
    const targetIndex = target - 1;
    // Segment centers: 1 at left (279°), 10 at right (441°)
    const targetAngle = ARCH_START + targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

    const currentAngle = pointerAngleRef.current;
    const duration = 3500;
    const startTime = performance.now();

    // Damped oscillation parameters
    const amplitude = 140;
    const damping = 3.5;
    const frequency = 3.5;

    // Calculate initial phase so oscillation starts at currentAngle
    const diff = Math.max(-amplitude, Math.min(amplitude, currentAngle - targetAngle));
    const initialPhase = Math.asin(diff / amplitude);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Damped harmonic oscillation centered on target
      const oscillation =
        amplitude * Math.exp(-damping * t) * Math.sin(2 * Math.PI * frequency * t + initialPhase);
      const angle = Math.max(ARCH_START, Math.min(ARCH_END, targetAngle + oscillation));

      setPointerAngle(angle);
      pointerAngleRef.current = angle;

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPointerAngle(targetAngle);
        pointerAngleRef.current = targetAngle;
        vibrateLong();
        setSpinning(false);
        setResult(target);
        onResultRef.current(target);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, disabled]);

  // Pointer triangle: tip points inward, base sits outside the arch
  const pointerTip = polarToCartesian(CX, CY, R_OUTER - 6, pointerAngle);
  const pointerWing1 = polarToCartesian(CX, CY, R_OUTER + 16, pointerAngle - 3);
  const pointerWing2 = polarToCartesian(CX, CY, R_OUTER + 16, pointerAngle + 3);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE / 2 + 60 }}>
        <svg
          width={SIZE}
          height={SIZE / 2 + 60}
          viewBox={`0 0 ${SIZE} ${SIZE / 2 + 60}`}
        >
          {/* Static arch segments — left to right over the top */}
          {NUMBERS.map((n, i) => {
            const segStart = ARCH_START + i * SEGMENT_ANGLE;
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

          {/* Animated pointer */}
          <polygon
            points={`${pointerTip.x},${pointerTip.y} ${pointerWing1.x},${pointerWing1.y} ${pointerWing2.x},${pointerWing2.y}`}
            fill={accentColor}
            stroke="#0A0A1A"
            strokeWidth="2"
          />
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
