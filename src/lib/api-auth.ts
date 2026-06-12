import { createHash, randomBytes } from "crypto";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { PLAN_QUOTAS } from "@/db/schema";
import { siteUrl } from "@/lib/site-url";

export type ApiKeyCheck =
  | {
      ok: true;
      keyId: number;
      plan: string;
      quota: number;
      /** Requêtes consommées sur la période, celle-ci incluse */
      used: number;
      /** Requêtes au-delà du quota (facturées à l'usage si overage activé) */
      overage: number;
    }
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

  // Remise à zéro mensuelle (usage + dépassement rapporté)
  const now      = new Date();
  const resetBase = new Date(key.usageResetAt);
  const nextReset = new Date(resetBase);
  nextReset.setMonth(nextReset.getMonth() + 1);
  let usage = key.usageThisMonth;
  if (now >= nextReset) {
    usage = 0;
    await db.update(schema.apiKeys)
      .set({ usageThisMonth: 0, overageReported: 0, usageResetAt: nextReset })
      .where(eq(schema.apiKeys.id, key.id));
  }

  if (usage >= key.monthlyQuota) {
    // Plans payants avec facturation à l'usage : la requête passe, le
    // dépassement sera rapporté à Stripe par le cron /api/cron/report-usage
    const canOverage = key.overageEnabled && key.plan !== "free";
    if (!canOverage) {
      return {
        ok: false, status: 429,
        message: `Quota mensuel de ${key.monthlyQuota.toLocaleString()} requêtes atteint. Activez la facturation à l'usage ou passez au plan supérieur : ${siteUrl}/developers`,
      };
    }
  }

  await db.update(schema.apiKeys)
    .set({
      usageThisMonth: sql`${schema.apiKeys.usageThisMonth} + 1`,
      lastUsedAt: now,
    })
    .where(eq(schema.apiKeys.id, key.id));

  const used = usage + 1;
  return {
    ok: true,
    keyId:   key.id,
    plan:    key.plan,
    quota:   key.monthlyQuota,
    used,
    overage: Math.max(0, used - key.monthlyQuota),
  };
}

/** En-têtes de transparence quota/usage à joindre aux réponses de l'API v1. */
export function quotaHeaders(auth: Extract<ApiKeyCheck, { ok: true }>): Record<string, string> {
  return {
    ...API_CORS_HEADERS,
    "X-Quota-Limit":   String(auth.quota),
    "X-Quota-Used":    String(auth.used),
    "X-Quota-Overage": String(auth.overage),
  };
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
