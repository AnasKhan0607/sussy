const isReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function getConfetti() {
  const mod = await import("canvas-confetti");
  return mod.default;
}

export async function fireConfetti(colors?: string[]) {
  if (isReducedMotion()) return;
  const confetti = await getConfetti();
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: colors ?? ["#8B5CF6", "#F59E0B", "#06B6D4", "#10B981"],
  });
}

export async function fireWinConfetti() {
  if (isReducedMotion()) return;
  const confetti = await getConfetti();
  const colors = ["#8B5CF6", "#F59E0B", "#06B6D4", "#10B981", "#FFFFFF"];

  // Three staggered bursts
  confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors });
  setTimeout(() => {
    confetti({ particleCount: 40, angle: 60, spread: 50, origin: { x: 0, y: 0.6 }, colors });
    confetti({ particleCount: 40, angle: 120, spread: 50, origin: { x: 1, y: 0.6 }, colors });
  }, 250);
  setTimeout(() => {
    confetti({ particleCount: 50, spread: 100, origin: { y: 0.5 }, colors });
  }, 500);
}
