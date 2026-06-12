import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiError, checkApiKey, quotaHeaders } from "@/lib/api-auth";

export const runtime = "nodejs";

/** DELETE /api/v1/webhooks/{id} — supprime un webhook de la clé appelante. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.status, auth.message);

  const { id } = await params;
  const webhookId = Number(id);
  if (!Number.isInteger(webhookId)) return apiError(400, "id invalide");

  // Supprimer d'abord l'historique de livraison (clé étrangère)
  const [owned] = await db
    .select({ id: schema.apiWebhooks.id })
    .from(schema.apiWebhooks)
    .where(
      and(
        eq(schema.apiWebhooks.id, webhookId),
        eq(schema.apiWebhooks.apiKeyId, auth.keyId),
      ),
    )
    .limit(1);
  if (!owned) return apiError(404, "Webhook introuvable");

  await db
    .delete(schema.webhookDeliveries)
    .where(eq(schema.webhookDeliveries.webhookId, webhookId));
  await db.delete(schema.apiWebhooks).where(eq(schema.apiWebhooks.id, webhookId));

  return Response.json({ deleted: webhookId }, { headers: quotaHeaders(auth) });
}
