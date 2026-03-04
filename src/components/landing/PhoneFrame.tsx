"use client";

import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "relative w-[240px] h-[480px] rounded-[36px] border-2 border-border-light bg-bg-primary overflow-hidden shrink-0",
        className
      )}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-bg-primary rounded-b-2xl z-10 border-b border-x border-border-light" />
      {/* Screen content */}
      <div className="absolute inset-2 top-8 bottom-2 rounded-[28px] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
