import { createHmac } from "crypto";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiError, checkApiKey, quotaHeaders } from "@/lib/api-auth";
import { siteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

/**
 * POST /api/v1/webhooks/{id}/test — envoie un payload fictif signé à l'URL du
 * webhook pour vérifier que l'endpoint est joignable et valide la signature.
 *
 * Le payload porte `"test": true` pour le distinguer d'un vrai événement.
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

  const [webhook] = await db
    .select({ url: schema.apiWebhooks.url, secret: schema.apiWebhooks.secret })
    .from(schema.apiWebhooks)
    .where(and(eq(schema.apiWebhooks.id, webhookId), eq(schema.apiWebhooks.apiKeyId, auth.keyId)))
    .limit(1);
  if (!webhook) return apiError(404, "Webhook introuvable");

  const payload = JSON.stringify({
    event: "part.status_changed",
    reference: "TEST-REFERENCE",
    manufacturer: "Test Manufacturer",
    oldStatus: "active",
    newStatus: "obsolete",
    url: `${siteUrl}/piece/test-manufacturer/test-reference`,
    occurredAt: new Date().toISOString(),
    test: true,
  });
  const signature = createHmac("sha256", webhook.secret).update(payload).digest("hex");

  let responseStatus: number | null = null;
  let success = false;
  let errorMessage: string | undefined;
  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SPB-Signature": `sha256=${signature}`,
        "User-Agent": "SparePartSearch-Webhooks/1.0",
      },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    });
    responseStatus = res.status;
    success = res.ok;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Erreur réseau";
  }

  return Response.json(
    { success, responseStatus, ...(errorMessage ? { error: errorMessage } : {}) },
    { status: success ? 200 : 502, headers: quotaHeaders(auth) },
  );
}
