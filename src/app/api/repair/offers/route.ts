import { NextRequest } from "next/server";
import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireApiKey } from "@/lib/api-auth";
import { normalizeReference, slugify } from "@/lib/normalize";
import { intParam } from "@/lib/params";

const { manufacturers, offers, parts, sellers } = schema;

/** "rexel.fr" → "Rexel", "conrad.com" → "Conrad", "rs-online.co.uk" → "Rs-online" */
function normalizeSellerName(raw: string): string {
  const withoutTld = raw.replace(/\.(fr|com|net|org|co\.uk|de|it|es|be|nl|eu|io|uk|us|ca)$/i, "");
  return withoutTld.charAt(0).toUpperCase() + withoutTld.slice(1);
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const runtime = "nodejs";

export interface RepairOffer {
  id: number;
  url: string;
  sellerName: string;
  sellerWebsite: string | null;
  referenceRaw: string;
  referenceNormalized: string;
  manufacturerName: string;
  partId: number;
}

/** GET — returns offers whose url is a bare domain root (no product path) */
export async function GET(req: NextRequest) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const limit = intParam(req.nextUrl.searchParams.get("limit"), { fallback: 500, min: 1, max: 2000 });

  const rows = await db
    .select({
      id: offers.id,
      url: offers.url,
      sellerName: sellers.name,
      sellerWebsite: sellers.website,
      referenceRaw: parts.referenceRaw,
      referenceNormalized: parts.referenceNormalized,
      manufacturerName: manufacturers.name,
      partId: parts.id,
    })
    .from(offers)
    .innerJoin(sellers, eq(offers.sellerId, sellers.id))
    .innerJoin(parts, eq(offers.partId, parts.id))
    .innerJoin(manufacturers, eq(parts.manufacturerId, manufacturers.id))
    .where(sql`${offers.url} ~ '^https?://[^/]+/?$'`)
    .orderBy(offers.id)
    .limit(limit);

  return Response.json({ offers: rows satisfies RepairOffer[] });
}

type PatchBody = {
  offerId?: number;
  referenceNormalized?: string;
  /** Nom ou slug du fabricant : lève l'ambiguïté quand plusieurs fabricants partagent une référence. */
  manufacturer?: string;
  sellerName?: string;
  url?: string;
};

/** PATCH — update an offer's url by offerId OR by (referenceNormalized [+ manufacturer] + sellerName) */
export async function PATCH(req: NextRequest) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!isHttpsUrl(body.url)) {
    return Response.json({ error: "url invalide" }, { status: 400 });
  }
  const url = body.url;

  if (body.offerId != null) {
    if (!Number.isInteger(body.offerId)) {
      return Response.json({ error: "offerId invalide" }, { status: 400 });
    }
    const updated = await db
      .update(offers)
      .set({ url })
      .where(eq(offers.id, body.offerId))
      .returning({ id: offers.id });
    return Response.json({ updated: updated.length });
  }

  if (body.referenceNormalized && body.sellerName) {
    const conditions = [eq(parts.referenceNormalized, normalizeReference(body.referenceNormalized))];
    if (body.manufacturer) {
      conditions.push(eq(manufacturers.slug, slugify(body.manufacturer)));
    }
    const candidates = await db
      .select({ id: parts.id })
      .from(parts)
      .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
      .where(and(...conditions))
      .limit(2);
    if (candidates.length === 0) return Response.json({ updated: 0 });
    if (candidates.length > 1) {
      return Response.json(
        { error: "Référence partagée par plusieurs fabricants : préciser manufacturer" },
        { status: 409 },
      );
    }

    const partId = candidates[0].id;
    const sellerId = await resolveSellerId(body.sellerName);

    await db
      .insert(offers)
      .values({ partId, sellerId, url, scrapedAt: new Date() })
      .onConflictDoUpdate({
        target: [offers.partId, offers.sellerId],
        set: { url, scrapedAt: new Date() },
      });

    return Response.json({ updated: 1 });
  }

  return Response.json({ error: "offerId ou (referenceNormalized + sellerName) requis" }, { status: 400 });
}

/**
 * Retrouve le vendeur par slug exact, puis par nom commençant par le nom
 * affiché ("Mouser" → "Mouser Electronics"), et le crée sinon. Pas de
 * recherche par sous-chaîne : "RS" ne doit pas tomber sur "ServerSupply".
 */
async function resolveSellerId(rawName: string): Promise<number> {
  const name = rawName.trim();
  const displayName = normalizeSellerName(name);
  const slugs = [...new Set([slugify(name), slugify(displayName)])].filter(Boolean);

  const bySlug = await db
    .select({ id: sellers.id, slug: sellers.slug })
    .from(sellers)
    .where(inArray(sellers.slug, slugs));
  if (bySlug.length > 0) {
    return (bySlug.find((s) => s.slug === slugs[0]) ?? bySlug[0]).id;
  }

  const [byPrefix] = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(ilike(sellers.name, `${escapeLike(displayName)} %`))
    .orderBy(sellers.id)
    .limit(1);
  if (byPrefix) return byPrefix.id;

  const website = name.includes(".") && !name.includes(" ") ? `https://${name}` : null;
  const [created] = await db
    .insert(sellers)
    .values({ name: displayName, slug: slugify(displayName), type: "distributeur_officiel", website })
    .onConflictDoUpdate({
      target: sellers.slug,
      set: { website: sql`COALESCE(${sellers.website}, excluded.website)` },
    })
    .returning({ id: sellers.id });
  return created.id;
}
