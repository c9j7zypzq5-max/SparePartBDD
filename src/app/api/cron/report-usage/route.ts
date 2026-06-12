import { NextRequest } from "next/server";
import Stripe from "stripe";
import { and, eq, gt, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/report-usage — rapporte à Stripe le dépassement de quota
 * (requêtes au-delà du quota mensuel) des clés en facturation à l'usage.
 *
 * Appelé toutes les heures par Vercel Cron (vercel.json). Seul le DELTA
 * depuis le dernier rapport est envoyé, en meter event "api_requests_overage"
 * — le prix à l'usage Stripe attaché à l'abonnement fait le reste.
 *
 * Auth : Vercel Cron envoie automatiquement `Authorization: Bearer $CRON_SECRET`
 * quand la variable d'environnement CRON_SECRET est définie.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ error: "CRON_SECRET non configurée" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: "STRIPE_SECRET_KEY non configurée" }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2026-05-27.dahlia" });

  // Clés actives, à l'usage, avec client Stripe et un usage au-dessus du quota
  const keys = await db
    .select({
      id:               schema.apiKeys.id,
      stripeCustomerId: schema.apiKeys.stripeCustomerId,
      monthlyQuota:     schema.apiKeys.monthlyQuota,
      usageThisMonth:   schema.apiKeys.usageThisMonth,
      overageReported:  schema.apiKeys.overageReported,
      usageResetAt:     schema.apiKeys.usageResetAt,
    })
    .from(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.active, true),
        eq(schema.apiKeys.overageEnabled, true),
        isNotNull(schema.apiKeys.stripeCustomerId),
        gt(schema.apiKeys.usageThisMonth, schema.apiKeys.monthlyQuota),
      ),
    );

  let reported = 0;
  const errors: string[] = [];

  for (const key of keys) {
    const overage = Math.max(0, key.usageThisMonth - key.monthlyQuota);
    const delta   = overage - key.overageReported;
    if (delta <= 0) continue;

    try {
      await stripe.billing.meterEvents.create({
        event_name: "api_requests_overage",
        // Idempotence : même clé + même période + même cumul ⇒ même identifier
        identifier: `key${key.id}-${key.usageResetAt.getTime()}-${overage}`,
        payload: {
          stripe_customer_id: key.stripeCustomerId!,
          value: String(delta),
        },
      });

      await db.update(schema.apiKeys)
        .set({ overageReported: sql`${schema.apiKeys.overageReported} + ${delta}` })
        .where(eq(schema.apiKeys.id, key.id));

      reported++;
    } catch (err) {
      errors.push(`key ${key.id}: ${String(err)}`);
    }
  }

  return Response.json({
    checked:  keys.length,
    reported,
    ...(errors.length ? { errors } : {}),
  });
}
