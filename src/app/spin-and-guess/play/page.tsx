"use client";

import { GameShell } from "@/components/layout/GameShell";

const ACCENT = "#06B6D4";

export default function SpinAndGuessPlay() {
  return (
    <GameShell title="Spin & Guess" accentColor={ACCENT}>
      <div className="text-center py-12">
        <p className="text-text-secondary">Gameplay coming next...</p>
      </div>
    </GameShell>
  );
}
