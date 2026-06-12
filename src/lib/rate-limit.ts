import type { NextRequest } from "next/server";

/**
 * Rate limiting en mémoire par fenêtre fixe.
 *
 * Limites par instance serverless : chaque instance Vercel a son propre
 * compteur, donc la limite réelle est `limit × nb d'instances chaudes`.
 * Suffisant contre les bots naïfs et le spam de formulaires ; pour une
 * garantie stricte multi-instances il faudrait un store partagé (Upstash
 * Redis, table Postgres) — inutile à ce stade.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Purge périodique des fenêtres expirées pour borner la mémoire
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Secondes avant la prochaine fenêtre (pour l'en-tête Retry-After) */
  retryAfterSec: number;
}

/**
 * Consomme une unité du compteur `key` (ex : "suggest:1.2.3.4").
 * @param limit    requêtes autorisées par fenêtre
 * @param windowMs durée de la fenêtre en millisecondes
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count++;
  const ok = bucket.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** IP du client derrière le proxy Vercel (x-forwarded-for) ou "unknown". */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Réponse 429 standard avec Retry-After. */
export function tooManyRequests(result: RateLimitResult): Response {
  return Response.json(
    { error: "Trop de requêtes — réessayez plus tard" },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    },
  );
}
