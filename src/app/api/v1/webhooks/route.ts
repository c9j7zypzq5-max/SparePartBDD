import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiError, checkApiKey, quotaHeaders } from "@/lib/api-auth";
import { normalizeReference } from "@/lib/normalize";

export const runtime = "nodejs";

const MAX_WEBHOOKS_PER_KEY = 5;
const MAX_WATCHED_REFERENCES = 500;

/**
 * POST /api/v1/webhooks — crée un webhook (plan Business uniquement).
 *
 * Body : { "url": "https://...", "references": ["6ES7214-1AG40-0XB0", ...] }
 * references : 1 à 500 références normalisées — obligatoire.
 *
 * À chaque changement de statut d'une pièce surveillée, un POST JSON signé
 * est envoyé à l'URL (signature HMAC-SHA256 dans X-SPB-Signature, calculée
 * avec le secret retourné ici — affiché une seule fois).
 */
export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.status, auth.message);
  if (auth.plan !== "business") {
    return apiError(403, "Les webhooks sont réservés au plan Business.");
  }

  let body: { url?: string; references?: string[] };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "JSON invalide");
  }

  // Destination : HTTPS public uniquement (pas de SSRF vers le réseau interne)
  let url: URL;
  try {
    url = new URL(body.url ?? "");
  } catch {
    return apiError(400, "url invalide");
  }
  if (url.protocol !== "https:") {
    return apiError(400, "url doit être en HTTPS");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(host)
  ) {
    return apiError(400, "url doit pointer vers un hôte public");
  }

  const references = Array.isArray(body.references)
    ? body.references.map(normalizeReference).filter(Boolean).slice(0, MAX_WATCHED_REFERENCES)
    : [];
  if (references.length === 0) {
    return apiError(400, `references doit contenir entre 1 et ${MAX_WATCHED_REFERENCES} références. La surveillance du catalogue entier n'est pas disponible.`);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.apiWebhooks)
    .where(eq(schema.apiWebhooks.apiKeyId, auth.keyId));
  if (count >= MAX_WEBHOOKS_PER_KEY) {
    return apiError(400, `Maximum ${MAX_WEBHOOKS_PER_KEY} webhooks par clé. Supprimez-en un d'abord.`);
  }

  const secret = `whsec_${randomBytes(24).toString("hex")}`;

  const [created] = await db
    .insert(schema.apiWebhooks)
    .values({
      apiKeyId: auth.keyId,
      url: url.toString(),
      secret,
      references,
    })
    .returning({ id: schema.apiWebhooks.id, createdAt: schema.apiWebhooks.createdAt });

  return Response.json(
    {
      id: created.id,
      url: url.toString(),
      references,
      secret,
      warning: "Copiez ce secret maintenant — il ne sera plus affiché. Vérifiez la signature X-SPB-Signature (HMAC-SHA256 du corps) avec ce secret.",
    },
    { status: 201, headers: quotaHeaders(auth) },
  );
}

/** GET /api/v1/webhooks — liste les webhooks de la clé (sans secret). */
export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.status, auth.message);
  if (auth.plan !== "business") {
    return apiError(403, "Les webhooks sont réservés au plan Business.");
  }

  const rows = await db
    .select({
      id: schema.apiWebhooks.id,
      url: schema.apiWebhooks.url,
      references: schema.apiWebhooks.references,
      active: schema.apiWebhooks.active,
      createdAt: schema.apiWebhooks.createdAt,
      lastDeliveryAt: schema.apiWebhooks.lastDeliveryAt,
      lastDeliveryStatus: schema.apiWebhooks.lastDeliveryStatus,
    })
    .from(schema.apiWebhooks)
    .where(eq(schema.apiWebhooks.apiKeyId, auth.keyId));

  return Response.json({ webhooks: rows }, { headers: quotaHeaders(auth) });
}
