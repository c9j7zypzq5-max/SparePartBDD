import { createHash, randomBytes } from "crypto";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { PLAN_QUOTAS } from "@/db/schema";
import { siteUrl } from "@/lib/site-url";

export type ApiKeyCheck =
  | { ok: true;  keyId: number; plan: string }
  | { ok: false; status: 401 | 429; message: string };

/** Génère une clé brute + son hash + son préfixe. */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw    = `spb_${randomBytes(24).toString("hex")}`;
  const hash   = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}

/** Vérifie la clé API dans le header Authorization, met à jour le compteur d'usage. */
export async function checkApiKey(req: NextRequest): Promise<ApiKeyCheck> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer spb_")) {
    return { ok: false, status: 401, message: "Authorization: Bearer <clé> manquant ou invalide." };
  }

  const raw  = auth.slice(7);
  const hash = createHash("sha256").update(raw).digest("hex");

  const [key] = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.keyHash, hash))
    .limit(1);

  if (!key)       return { ok: false, status: 401, message: "Clé API invalide." };
  if (!key.active) return { ok: false, status: 401, message: "Clé API désactivée." };

  // Remise à zéro mensuelle
  const now      = new Date();
  const resetBase = new Date(key.usageResetAt);
  const nextReset = new Date(resetBase);
  nextReset.setMonth(nextReset.getMonth() + 1);
  let usage = key.usageThisMonth;
  if (now >= nextReset) {
    usage = 0;
    await db.update(schema.apiKeys)
      .set({ usageThisMonth: 0, usageResetAt: nextReset })
      .where(eq(schema.apiKeys.id, key.id));
  }

  if (usage >= key.monthlyQuota) {
    return {
      ok: false, status: 429,
      message: `Quota mensuel de ${key.monthlyQuota.toLocaleString()} requêtes atteint. Passez au plan supérieur : ${siteUrl}/developers`,
    };
  }

  await db.update(schema.apiKeys)
    .set({
      usageThisMonth: sql`${schema.apiKeys.usageThisMonth} + 1`,
      lastUsedAt: now,
    })
    .where(eq(schema.apiKeys.id, key.id));

  return { ok: true, keyId: key.id, plan: key.plan };
}

/** Réponse d'erreur JSON standard pour l'API v1. */
export function apiError(status: number, message: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

/** En-têtes CORS standard pour l'API publique. */
export const API_CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export { PLANS } from "@/lib/plans";
