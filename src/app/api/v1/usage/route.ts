import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiError, checkApiKey, quotaHeaders } from "@/lib/api-auth";

export const runtime = "nodejs";

/**
 * GET /api/v1/usage — quota et consommation de la clé appelante pour la
 * période de facturation en cours.
 *
 * Disponible pour tous les plans. Utile pour monitorer depuis votre propre
 * dashboard sans attendre les en-têtes X-Quota-*.
 */
export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.status, auth.message);

  const [key] = await db
    .select({
      plan:             schema.apiKeys.plan,
      monthlyQuota:     schema.apiKeys.monthlyQuota,
      usageThisMonth:   schema.apiKeys.usageThisMonth,
      usageResetAt:     schema.apiKeys.usageResetAt,
      overageEnabled:   schema.apiKeys.overageEnabled,
      overageReported:  schema.apiKeys.overageReported,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.id, auth.keyId))
    .limit(1);

  const used      = key.usageThisMonth;
  const quota     = key.monthlyQuota;
  const remaining = Math.max(0, quota - used);
  const overage   = Math.max(0, used - quota);

  const periodStart = key.usageResetAt;
  const periodEnd   = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return Response.json(
    {
      plan:             key.plan,
      quota,
      used,
      remaining,
      overageEnabled:   key.overageEnabled,
      overageRequests:  key.overageReported,
      overage,
      periodStart:      periodStart.toISOString(),
      periodEnd:        periodEnd.toISOString(),
    },
    { headers: quotaHeaders(auth) },
  );
}
