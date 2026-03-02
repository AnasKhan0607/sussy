"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface GameShellProps {
  title: string;
  accentColor?: string;
  onBack?: () => void;
  children: React.ReactNode;
}

export function GameShell({
  title,
  accentColor = "var(--color-brand)",
  onBack,
  children,
}: GameShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center gap-3 p-4">
        <button
          onClick={onBack || (() => router.push("/"))}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold" style={{ color: accentColor }}>
          {title}
        </h1>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 px-4 pb-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
