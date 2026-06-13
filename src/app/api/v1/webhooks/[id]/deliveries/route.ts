import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiError, checkApiKey, quotaHeaders } from "@/lib/api-auth";

export const runtime = "nodejs";

/**
 * GET /api/v1/webhooks/{id}/deliveries — historique des 20 dernières tentatives
 * de livraison pour ce webhook (événement, statut HTTP, succès, date).
 */
export async function GET(
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

  const deliveries = await db
    .select({
      id:             schema.webhookDeliveries.id,
      attempts:       schema.webhookDeliveries.attempts,
      success:        schema.webhookDeliveries.success,
      responseStatus: schema.webhookDeliveries.responseStatus,
      lastAttemptAt:  schema.webhookDeliveries.lastAttemptAt,
      reference:      schema.parts.referenceRaw,
      oldStatus:      schema.partStatusEvents.oldStatus,
      newStatus:      schema.partStatusEvents.newStatus,
      occurredAt:     schema.partStatusEvents.createdAt,
    })
    .from(schema.webhookDeliveries)
    .innerJoin(schema.partStatusEvents, eq(schema.partStatusEvents.id, schema.webhookDeliveries.eventId))
    .innerJoin(schema.parts, eq(schema.parts.id, schema.partStatusEvents.partId))
    .where(eq(schema.webhookDeliveries.webhookId, webhookId))
    .orderBy(desc(schema.webhookDeliveries.lastAttemptAt))
    .limit(20);

  return Response.json({ deliveries }, { headers: quotaHeaders(auth) });
}
