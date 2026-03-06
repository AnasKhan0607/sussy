import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Page not found
      </h1>
      <p className="text-text-secondary mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-surface border border-border rounded-xl text-text-primary font-medium hover:bg-surface-hover"
      >
        Go home
      </Link>
    </div>
  );
}
