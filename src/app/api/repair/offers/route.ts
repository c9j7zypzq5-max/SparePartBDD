import { NextRequest } from "next/server";
import { eq, ilike, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { slugify } from "@/lib/normalize";

/** "rexel.fr" → "Rexel", "conrad.com" → "Conrad", "rs-online.co.uk" → "Rs-online" */
function normalizeSellerName(raw: string): string {
  const withoutTld = raw.replace(/\.(fr|com|net|org|co\.uk|de|it|es|be|nl|eu|io|uk|us|ca)$/i, "");
  return withoutTld.charAt(0).toUpperCase() + withoutTld.slice(1);
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

function authCheck(req: NextRequest): Response | null {
  const apiKey = process.env.INGEST_API_KEY;
  if (!apiKey) return Response.json({ error: "INGEST_API_KEY non configurée" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${apiKey}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }
  return null;
}

/** GET — returns offers whose url is a bare domain root (no product path) */
export async function GET(req: NextRequest) {
  const authErr = authCheck(req);
  if (authErr) return authErr;

  const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? 500);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 2000) : 500;

  const rows = await db
    .select({
      id: schema.offers.id,
      url: schema.offers.url,
      sellerName: schema.sellers.name,
      sellerWebsite: schema.sellers.website,
      referenceRaw: schema.parts.referenceRaw,
      referenceNormalized: schema.parts.referenceNormalized,
      manufacturerName: schema.manufacturers.name,
      partId: schema.parts.id,
    })
    .from(schema.offers)
    .innerJoin(schema.sellers, eq(schema.offers.sellerId, schema.sellers.id))
    .innerJoin(schema.parts, eq(schema.offers.partId, schema.parts.id))
    .innerJoin(schema.manufacturers, eq(schema.parts.manufacturerId, schema.manufacturers.id))
    .where(sql`${schema.offers.url} ~ '^https?://[^/]+/?$'`)
    .orderBy(schema.offers.id)
    .limit(limit);

  return Response.json({ offers: rows as RepairOffer[] });
}

/** PATCH — update an offer's url by offerId OR by (referenceNormalized + sellerName) */
export async function PATCH(req: NextRequest) {
  const authErr = authCheck(req);
  if (authErr) return authErr;

  let body: { offerId?: number; referenceNormalized?: string; sellerName?: string; url: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body.url?.startsWith("https://")) {
    return Response.json({ error: "url invalide" }, { status: 400 });
  }

  if (body.offerId) {
    await db
      .update(schema.offers)
      .set({ url: body.url })
      .where(eq(schema.offers.id, body.offerId));
    return Response.json({ updated: 1 });
  }

  if (body.referenceNormalized && body.sellerName) {
    const partRows = await db
      .select({ id: schema.parts.id })
      .from(schema.parts)
      .where(eq(schema.parts.referenceNormalized, body.referenceNormalized))
      .limit(1);
    if (partRows.length === 0) return Response.json({ updated: 0 });

    const partId = partRows[0].id;

    const sellerRows = await db
      .select({ id: schema.sellers.id })
      .from(schema.sellers)
      .where(ilike(schema.sellers.name, `%${body.sellerName}%`))
      .limit(1);

    let sellerId: number;
    if (sellerRows.length > 0) {
      sellerId = sellerRows[0].id;
    } else {
      const displayName = normalizeSellerName(body.sellerName);
      const slug = slugify(displayName);
      const [created] = await db
        .insert(schema.sellers)
        .values({ name: displayName, slug, type: "distributeur_officiel", website: body.sellerName })
        .onConflictDoUpdate({
          target: schema.sellers.slug,
          set: { website: body.sellerName },
        })
        .returning({ id: schema.sellers.id });
      sellerId = created.id;
    }

    await db
      .insert(schema.offers)
      .values({ partId, sellerId, url: body.url, scrapedAt: new Date() })
      .onConflictDoUpdate({
        target: [schema.offers.partId, schema.offers.sellerId],
        set: { url: body.url, scrapedAt: new Date() },
      });

    return Response.json({ updated: 1 });
  }

  return Response.json({ error: "offerId ou (referenceNormalized + sellerName) requis" }, { status: 400 });
}
