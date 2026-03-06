"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Something went wrong
      </h1>
      <p className="text-text-secondary mb-6">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-surface border border-border rounded-xl text-text-primary font-medium hover:bg-surface-hover cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
