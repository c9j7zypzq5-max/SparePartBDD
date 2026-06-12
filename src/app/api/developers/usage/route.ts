import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const runtime = "nodejs";

/**
 * GET /api/developers/usage — consultation de la consommation d'une clé.
 * Auth : Authorization: Bearer spb_… (la consultation ne décompte PAS de requête).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer spb_")) {
    return Response.json(
      { error: "Authorization: Bearer <clé> manquant ou invalide." },
      { status: 401 },
    );
  }

  const hash = createHash("sha256").update(auth.slice(7)).digest("hex");
  const [key] = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.keyHash, hash))
    .limit(1);

  if (!key) return Response.json({ error: "Clé API invalide." }, { status: 401 });

  // Usage effectif : 0 si la période est terminée (le reset réel se fait à la
  // prochaine requête API, ici on ne fait que lire)
  const nextReset = new Date(key.usageResetAt);
  nextReset.setMonth(nextReset.getMonth() + 1);
  const periodOver = new Date() >= nextReset;
  const used    = periodOver ? 0 : key.usageThisMonth;
  const overage = Math.max(0, used - key.monthlyQuota);

  return Response.json({
    keyPrefix:      key.keyPrefix,
    plan:           key.plan,
    active:         key.active,
    quota:          key.monthlyQuota,
    used,
    remaining:      Math.max(0, key.monthlyQuota - used),
    overage,
    overageEnabled: key.overageEnabled,
    /** Estimation du coût du dépassement en euros (1 €/1 000 req) */
    overageCostEur: Math.round(overage * 0.001 * 100) / 100,
    periodStart:    periodOver ? nextReset : key.usageResetAt,
    periodEnd:      periodOver
      ? new Date(new Date(nextReset).setMonth(nextReset.getMonth() + 1))
      : nextReset,
    lastUsedAt:     key.lastUsedAt,
  });
}
