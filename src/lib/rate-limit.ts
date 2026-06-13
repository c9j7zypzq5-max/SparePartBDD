// Limiteur de débit en mémoire (sliding window par IP).
// En production multi-instance (Vercel), remplacer par Upstash Redis
// pour un comptage partagé entre les workers.

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function rateLimit(
  ip: string,
  opts: { limit?: number; windowMs?: number } = {},
): boolean {
  const { limit = 20, windowMs = 60_000 } = opts;
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function getClientIp(headers: { get(name: string): string | null }): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
