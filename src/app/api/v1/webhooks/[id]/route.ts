import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiError, checkApiKey, quotaHeaders } from "@/lib/api-auth";
import { normalizeReference } from "@/lib/normalize";

export const runtime = "nodejs";

const MAX_WATCHED_REFERENCES = 500;

async function ownedWebhook(webhookId: number, keyId: number) {
  const [row] = await db
    .select({ id: schema.apiWebhooks.id })
    .from(schema.apiWebhooks)
    .where(and(eq(schema.apiWebhooks.id, webhookId), eq(schema.apiWebhooks.apiKeyId, keyId)))
    .limit(1);
  return row ?? null;
}

/** PATCH /api/v1/webhooks/{id} — modifie url, references et/ou active. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.status, auth.message);
  if (auth.plan !== "business") return apiError(403, "Les webhooks sont réservés au plan Business.");

  const { id } = await params;
  const webhookId = Number(id);
  if (!Number.isInteger(webhookId)) return apiError(400, "id invalide");
  if (!(await ownedWebhook(webhookId, auth.keyId))) return apiError(404, "Webhook introuvable");

  let body: { url?: string; references?: string[]; active?: boolean };
  try { body = await req.json(); }
  catch { return apiError(400, "JSON invalide"); }

  const updates: { url?: string; references?: string[]; active?: boolean } = {};

  if (body.url !== undefined) {
    let url: URL;
    try { url = new URL(body.url); }
    catch { return apiError(400, "url invalide"); }
    if (url.protocol !== "https:") return apiError(400, "url doit être en HTTPS");
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(host)
    ) return apiError(400, "url doit pointer vers un hôte public");
    updates.url = url.toString();
  }

  if (body.references !== undefined) {
    if (!Array.isArray(body.references)) return apiError(400, "references doit être un tableau");
    const refs = body.references.map(normalizeReference).filter(Boolean).slice(0, MAX_WATCHED_REFERENCES);
    if (refs.length === 0) return apiError(400, `references doit contenir entre 1 et ${MAX_WATCHED_REFERENCES} références.`);
    updates.references = refs;
  }

  if (typeof body.active === "boolean") updates.active = body.active;

  if (Object.keys(updates).length === 0) {
    return apiError(400, "Aucun champ à modifier (url, references, active)");
  }

  const [updated] = await db
    .update(schema.apiWebhooks)
    .set(updates)
    .where(eq(schema.apiWebhooks.id, webhookId))
    .returning({
      id: schema.apiWebhooks.id,
      url: schema.apiWebhooks.url,
      references: schema.apiWebhooks.references,
      active: schema.apiWebhooks.active,
    });

  return Response.json(updated, { headers: quotaHeaders(auth) });
}

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

  if (!(await ownedWebhook(webhookId, auth.keyId))) return apiError(404, "Webhook introuvable");

  await db.delete(schema.webhookDeliveries).where(eq(schema.webhookDeliveries.webhookId, webhookId));
  await db.delete(schema.apiWebhooks).where(eq(schema.apiWebhooks.id, webhookId));

  return Response.json({ deleted: webhookId }, { headers: quotaHeaders(auth) });
}
