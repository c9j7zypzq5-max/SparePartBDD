import { NextRequest } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { generateApiKey } from "@/lib/api-auth";
import { PLAN_QUOTAS } from "@/db/schema";
import { siteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY non configurée");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

/** POST /api/stripe/checkout — crée une session Stripe Checkout pour pro/business. */
export async function POST(req: NextRequest) {
  let body: { email?: string; plan?: string; overage?: boolean };
  try { body = await req.json(); } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Email invalide" }, { status: 400 });
  }

  const plan = body.plan;
  if (plan !== "pro" && plan !== "business") {
    return Response.json({ error: "Plan invalide (pro | business)" }, { status: 400 });
  }

  const priceId = plan === "pro"
    ? process.env.STRIPE_PRICE_PRO
    : process.env.STRIPE_PRICE_BUSINESS;

  if (!priceId) {
    return Response.json({ error: `STRIPE_PRICE_${plan.toUpperCase()} non configuré` }, { status: 500 });
  }

  // Pré-générer la clé API — elle sera activée dans le webhook
  const { raw, hash, prefix } = generateApiKey();
  const resetAt = new Date();
  resetAt.setMonth(resetAt.getMonth() + 1);

  // Si l'email a déjà une clé, on upgrades plutôt que de créer
  const [existing] = await db
    .select({ id: schema.apiKeys.id })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.ownerEmail, email))
    .limit(1);

  let apiKeyId: number;
  if (existing) {
    apiKeyId = existing.id;
  } else {
    const [inserted] = await db.insert(schema.apiKeys).values({
      keyHash:      hash,
      keyPrefix:    prefix,
      ownerEmail:   email,
      plan:         "free",
      monthlyQuota: PLAN_QUOTAS.free,
      usageResetAt: resetAt,
      active:       false,
    }).returning({ id: schema.apiKeys.id });
    apiKeyId = inserted.id;
  }

  // Option facturation à l'usage : prix metered Stripe ajouté à l'abonnement
  // (les line items metered n'ont pas de quantity — Stripe la déduit du meter)
  const meteredPriceId = process.env.STRIPE_PRICE_OVERAGE;
  const wantsOverage   = body.overage === true && !!meteredPriceId;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode:                 "subscription",
    line_items: [
      { price: priceId, quantity: 1 },
      ...(wantsOverage ? [{ price: meteredPriceId! }] : []),
    ],
    customer_email:       email,
    success_url:          `${siteUrl}/developers/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:           `${siteUrl}/developers`,
    metadata: {
      apiKeyId:  String(apiKeyId),
      plan,
      keyHash:   hash,
      keyPrefix: prefix,
      overage:   wantsOverage ? "1" : "0",
    },
  });

  return Response.json({ url: session.url }, { status: 200 });
}
