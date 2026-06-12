import { NextRequest } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PLAN_QUOTAS } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY non configurée");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

/** Extrait l'ID de subscription depuis invoice.parent (Stripe API v2026). */
function getSubIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json({ error: "STRIPE_WEBHOOK_SECRET non configurée" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature") ?? "";
  const rawBody   = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return Response.json({ error: `Webhook signature invalide: ${err}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { apiKeyId, plan, keyHash, keyPrefix, overage } = session.metadata ?? {};
      if (!apiKeyId || !plan) break;

      const id    = parseInt(apiKeyId, 10);
      const quota = plan === "enterprise" ? PLAN_QUOTAS.enterprise : PLAN_QUOTAS.pro;

      if (keyHash && keyPrefix) {
        await db.update(schema.apiKeys)
          .set({
            plan:                 plan as "pro" | "enterprise",
            monthlyQuota:         quota,
            active:               true,
            overageEnabled:       overage === "1",
            stripeCustomerId:     session.customer as string | null,
            stripeSubscriptionId: session.subscription as string | null,
          })
          .where(eq(schema.apiKeys.id, id));
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub    = event.data.object as Stripe.Subscription;
      const planId = sub.items.data[0]?.price.id;
      const isPro  = planId === process.env.STRIPE_PRICE_PRO;
      const plan   = isPro ? "pro" : "enterprise";
      const quota  = isPro ? PLAN_QUOTAS.pro : PLAN_QUOTAS.enterprise;

      await db.update(schema.apiKeys)
        .set({ plan: plan as "pro" | "enterprise", monthlyQuota: quota })
        .where(eq(schema.apiKeys.stripeSubscriptionId, sub.id));
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db.update(schema.apiKeys)
        .set({ plan: "free", monthlyQuota: PLAN_QUOTAS.free, overageEnabled: false })
        .where(eq(schema.apiKeys.stripeSubscriptionId, sub.id));
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId   = getSubIdFromInvoice(invoice);
      if (subId) {
        await db.update(schema.apiKeys)
          .set({ active: false })
          .where(eq(schema.apiKeys.stripeSubscriptionId, subId));
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId   = getSubIdFromInvoice(invoice);
      if (subId) {
        await db.update(schema.apiKeys)
          .set({ active: true })
          .where(eq(schema.apiKeys.stripeSubscriptionId, subId));
      }
      break;
    }
  }

  return Response.json({ received: true });
}
