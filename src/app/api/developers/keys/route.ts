import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { generateApiKey } from "@/lib/api-auth";
import { PLAN_QUOTAS } from "@/db/schema";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** POST /api/developers/keys — génère une clé gratuite (email requis). */
export async function POST(req: NextRequest) {
  // Anti-abus : 3 créations de clé / heure / IP (une clé = 1 000 req/mois gratuites)
  const rl = rateLimit(`keys:${clientIp(req)}`, 3, 3_600_000);
  if (!rl.ok) return tooManyRequests(rl);

  let body: { email?: string };
  try { body = await req.json(); } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Email invalide" }, { status: 400 });
  }

  // Un seul compte free par email — retourner un message si déjà existant
  const [existing] = await db
    .select({ id: schema.apiKeys.id, keyPrefix: schema.apiKeys.keyPrefix, plan: schema.apiKeys.plan })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.ownerEmail, email))
    .limit(1);

  if (existing) {
    return Response.json(
      {
        error:   "Un compte existe déjà pour cet email.",
        keyPrefix: existing.keyPrefix,
        plan:    existing.plan,
        hint:    "La clé n'est affichée qu'une seule fois à la création. Contactez-nous pour la réinitialiser.",
      },
      { status: 409 },
    );
  }

  const { raw, hash, prefix } = generateApiKey();

  const resetAt = new Date();
  resetAt.setMonth(resetAt.getMonth() + 1);

  await db.insert(schema.apiKeys).values({
    keyHash:       hash,
    keyPrefix:     prefix,
    ownerEmail:    email,
    plan:          "free",
    monthlyQuota:  PLAN_QUOTAS.free,
    usageResetAt:  resetAt,
  });

  return Response.json({
    key:       raw,
    prefix,
    plan:      "free",
    quota:     PLAN_QUOTAS.free,
    warning:   "Copiez cette clé maintenant — elle ne sera plus affichée.",
  }, { status: 201 });
}
