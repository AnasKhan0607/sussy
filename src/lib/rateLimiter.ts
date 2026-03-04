const requestLog = new Map<string, number[]>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
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
  limit = 5,
  windowMs = 60_000
): { success: boolean; remaining: number; resetIn: number } {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const resetIn = Math.ceil((oldest + windowMs - now) / 1000);
    return { success: false, remaining: 0, resetIn };
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);

  return { success: true, remaining: limit - timestamps.length, resetIn: 0 };
}
