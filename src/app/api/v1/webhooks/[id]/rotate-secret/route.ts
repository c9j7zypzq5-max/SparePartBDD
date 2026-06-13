import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiError, checkApiKey, quotaHeaders } from "@/lib/api-auth";

export const runtime = "nodejs";

/**
 * POST /api/v1/webhooks/{id}/rotate-secret — régénère le secret HMAC du webhook.
 *
 * À utiliser si le secret actuel est compromis. Le nouveau secret est affiché
 * une seule fois — mettez à jour votre endpoint avant le prochain cron (toutes les heures).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.status, auth.message);
  if (auth.plan !== "business") return apiError(403, "Les webhooks sont réservés au plan Business.");

  const { id } = await params;
  const webhookId = Number(id);
  if (!Number.isInteger(webhookId)) return apiError(400, "id invalide");

  const [owned] = await db
    .select({ id: schema.apiWebhooks.id })
    .from(schema.apiWebhooks)
    .where(and(eq(schema.apiWebhooks.id, webhookId), eq(schema.apiWebhooks.apiKeyId, auth.keyId)))
    .limit(1);
  if (!owned) return apiError(404, "Webhook introuvable");

  const secret = `whsec_${randomBytes(24).toString("hex")}`;
  await db.update(schema.apiWebhooks).set({ secret }).where(eq(schema.apiWebhooks.id, webhookId));

  return Response.json(
    {
      secret,
      warning: "Copiez ce secret maintenant — il ne sera plus affiché. Mettez à jour votre endpoint avant le prochain cron.",
    },
    { headers: quotaHeaders(auth) },
  );
}
