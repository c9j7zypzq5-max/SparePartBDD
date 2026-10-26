// Limiteur de débit en mémoire (fenêtre fixe par bucket × IP).
// Sur Vercel, chaque instance compte de son côté : c'est un garde-fou contre
// les rafales, pas un quota global. Pour un comptage partagé entre instances,
// remplacer par Upstash Redis (@upstash/ratelimit).

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
/** Au-delà, les entrées expirées sont purgées pour borner la mémoire. */
const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): boolean {
  const { limit = 20, windowMs = 60_000 } = opts;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    if (store.size >= MAX_KEYS) prune(now);
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function prune(now: number): void {
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
  // Encore plein (rafale distribuée) : on repart de zéro plutôt que de grossir sans fin.
  if (store.size >= MAX_KEYS) store.clear();
}

export function getClientIp(headers: { get(name: string): string | null }): string {
  // x-real-ip est posé par Vercel ; le premier élément de x-forwarded-for
  // peut être fourni par le client derrière un proxy qui concatène.
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Applique la limite `limit` requêtes par fenêtre pour ce client sur ce
 * bucket (un compteur par endpoint). Renvoie une réponse 429 à retourner
 * telle quelle, ou null si la requête peut passer.
 */
export function rateLimitResponse(
  req: { headers: Headers },
  bucket: string,
  opts: { limit: number; windowMs?: number },
): Response | null {
  const windowMs = opts.windowMs ?? 60_000;
  const key = `${bucket}:${getClientIp(req.headers)}`;
  if (rateLimit(key, { limit: opts.limit, windowMs })) return null;
  return Response.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) } },
  );
}
