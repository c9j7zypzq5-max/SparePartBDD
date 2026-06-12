import { createHmac } from "crypto";
import { NextRequest } from "next/server";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { siteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ATTEMPTS = 3;
const MAX_DELIVERIES_PER_RUN = 100;
const DELIVERY_TIMEOUT_MS = 10_000;
const EVENT_RETENTION_DAYS = 7;

/**
 * GET /api/cron/deliver-webhooks — livre les changements de statut aux
 * webhooks des clients Business (vercel.json, toutes les heures).
 *
 * Pour chaque événement non livré × webhook actif concerné :
 *  - POST JSON signé HMAC-SHA256 (en-tête X-SPB-Signature: sha256=<hex>)
 *  - 3 tentatives max par paire (une par run), succès = HTTP 2xx
 *
 * Auth : Vercel Cron envoie `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ error: "CRON_SECRET non configurée" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const since = new Date(Date.now() - EVENT_RETENTION_DAYS * 86_400_000);

  // Événements récents avec les infos pièce nécessaires au payload
  const events = await db
    .select({
      eventId: schema.partStatusEvents.id,
      oldStatus: schema.partStatusEvents.oldStatus,
      newStatus: schema.partStatusEvents.newStatus,
      occurredAt: schema.partStatusEvents.createdAt,
      reference: schema.parts.referenceRaw,
      referenceNormalized: schema.parts.referenceNormalized,
      partSlug: schema.parts.slug,
      manufacturerName: schema.manufacturers.name,
      manufacturerSlug: schema.manufacturers.slug,
    })
    .from(schema.partStatusEvents)
    .innerJoin(schema.parts, eq(schema.parts.id, schema.partStatusEvents.partId))
    .innerJoin(schema.manufacturers, eq(schema.manufacturers.id, schema.parts.manufacturerId))
    .where(gt(schema.partStatusEvents.createdAt, since))
    .orderBy(schema.partStatusEvents.createdAt);

  if (events.length === 0) {
    return Response.json({ delivered: 0, failed: 0, skipped: 0, note: "aucun événement" });
  }

  // Webhooks actifs dont la clé Business est active
  const webhooks = await db
    .select({
      id: schema.apiWebhooks.id,
      url: schema.apiWebhooks.url,
      secret: schema.apiWebhooks.secret,
      references: schema.apiWebhooks.references,
    })
    .from(schema.apiWebhooks)
    .innerJoin(schema.apiKeys, eq(schema.apiKeys.id, schema.apiWebhooks.apiKeyId))
    .where(
      and(
        eq(schema.apiWebhooks.active, true),
        eq(schema.apiKeys.active, true),
        eq(schema.apiKeys.plan, "business"),
      ),
    );

  if (webhooks.length === 0) {
    return Response.json({ delivered: 0, failed: 0, skipped: 0, note: "aucun webhook actif" });
  }

  let delivered = 0;
  let failed = 0;
  let skipped = 0;
  let processed = 0;

  for (const webhook of webhooks) {
    const watched = new Set(webhook.references);

    for (const event of events) {
      if (processed >= MAX_DELIVERIES_PER_RUN) break;
      // references vide = tout le catalogue
      if (watched.size > 0 && !watched.has(event.referenceNormalized)) continue;

      // Déjà livré ou épuisé ? (upsert du suivi par paire webhook × événement)
      const [tracking] = await db
        .select()
        .from(schema.webhookDeliveries)
        .where(
          and(
            eq(schema.webhookDeliveries.webhookId, webhook.id),
            eq(schema.webhookDeliveries.eventId, event.eventId),
          ),
        )
        .limit(1);
      if (tracking && (tracking.success || tracking.attempts >= MAX_ATTEMPTS)) {
        skipped++;
        continue;
      }

      processed++;

      const payload = JSON.stringify({
        event: "part.status_changed",
        reference: event.reference,
        manufacturer: event.manufacturerName,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
        url: `${siteUrl}/piece/${event.manufacturerSlug}/${event.partSlug}`,
        occurredAt: event.occurredAt.toISOString(),
      });
      const signature = createHmac("sha256", webhook.secret).update(payload).digest("hex");

      let responseStatus: number | null = null;
      let success = false;
      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SPB-Signature": `sha256=${signature}`,
            "User-Agent": "SparePartSearch-Webhooks/1.0",
          },
          body: payload,
          signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
        });
        responseStatus = res.status;
        success = res.ok;
      } catch {
        /* timeout / réseau : compté comme tentative échouée */
      }

      if (tracking) {
        await db
          .update(schema.webhookDeliveries)
          .set({
            attempts: tracking.attempts + 1,
            success,
            responseStatus,
            lastAttemptAt: new Date(),
          })
          .where(eq(schema.webhookDeliveries.id, tracking.id));
      } else {
        await db.insert(schema.webhookDeliveries).values({
          webhookId: webhook.id,
          eventId: event.eventId,
          attempts: 1,
          success,
          responseStatus,
          lastAttemptAt: new Date(),
        });
      }

      await db
        .update(schema.apiWebhooks)
        .set({ lastDeliveryAt: new Date(), lastDeliveryStatus: responseStatus })
        .where(eq(schema.apiWebhooks.id, webhook.id));

      if (success) delivered++;
      else failed++;
    }
  }

  // Purge des événements au-delà de la rétention (et de leur suivi)
  const expired = await db
    .select({ id: schema.partStatusEvents.id })
    .from(schema.partStatusEvents)
    .where(lt(schema.partStatusEvents.createdAt, since))
    .limit(500);
  if (expired.length > 0) {
    const ids = expired.map((e) => e.id);
    await db
      .delete(schema.webhookDeliveries)
      .where(sql`${schema.webhookDeliveries.eventId} = ANY(ARRAY[${sql.join(ids.map((i) => sql`${i}`), sql`, `)}]::int[])`);
    await db
      .delete(schema.partStatusEvents)
      .where(sql`${schema.partStatusEvents.id} = ANY(ARRAY[${sql.join(ids.map((i) => sql`${i}`), sql`, `)}]::int[])`);
  }

  return Response.json({ delivered, failed, skipped, purgedEvents: expired.length });
}
