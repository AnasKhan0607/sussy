const requestLog = new Map<string, number[]>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

// A request must satisfy EVERY rule to be allowed.
export type RateRule = { limit: number; windowMs: number };

export const DEFAULT_RULES: RateRule[] = [
  { limit: 1, windowMs: 60_000 }, // 1 request per minute
  { limit: 10, windowMs: 3_600_000 }, // 10 requests per hour
];

function cleanup(maxWindowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - maxWindowMs;
  for (const [key, timestamps] of requestLog) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, valid);
    }
  }
}

export function rateLimit(
  ip: string,
  rules: RateRule[] = DEFAULT_RULES
): { success: boolean; remaining: number; resetIn: number } {
  const maxWindowMs = Math.max(...rules.map((r) => r.windowMs));
  cleanup(maxWindowMs);

  const now = Date.now();
  // Keep only timestamps relevant to the longest window.
  const timestamps = (requestLog.get(ip) ?? []).filter(
    (t) => t > now - maxWindowMs
  );

  // Check every rule; a request is blocked if any window is full.
  let blocked = false;
  let resetIn = 0;
  let remaining = Infinity;

  for (const { limit, windowMs } of rules) {
    const inWindow = timestamps.filter((t) => t > now - windowMs);
    remaining = Math.min(remaining, limit - inWindow.length);

    if (inWindow.length >= limit) {
      blocked = true;
      const oldest = inWindow[0];
      const ruleResetIn = Math.ceil((oldest + windowMs - now) / 1000);
      resetIn = Math.max(resetIn, ruleResetIn);
    }
  }

  if (blocked) {
    return { success: false, remaining: 0, resetIn };
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);

  return { success: true, remaining: Math.max(0, remaining), resetIn: 0 };
}
