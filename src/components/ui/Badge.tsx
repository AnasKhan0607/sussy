import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        className
      )}
      style={{
        backgroundColor: color ? `${color}20` : undefined,
        color: color || undefined,
      }}
    >
      {children}
    </span>
  );
}
