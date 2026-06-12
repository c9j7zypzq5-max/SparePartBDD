import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeReference } from "@/lib/normalize";
import { checkApiKey, apiError, API_CORS_HEADERS } from "@/lib/api-auth";

export const runtime = "nodejs";

type Params = Promise<{ reference: string }>;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.status, auth.message);

  const { reference } = await params;
  const refNorm = normalizeReference(decodeURIComponent(reference));

  const [row] = await db
    .select({ part: schema.parts, manufacturer: schema.manufacturers, category: schema.categories })
    .from(schema.parts)
    .innerJoin(schema.manufacturers, eq(schema.manufacturers.id, schema.parts.manufacturerId))
    .leftJoin(schema.categories, eq(schema.categories.id, schema.parts.categoryId))
    .where(eq(schema.parts.referenceNormalized, refNorm))
    .limit(1);

  if (!row) return apiError(404, `Référence introuvable : ${reference}`);

  const { part, manufacturer, category } = row;

  // Références de remplacement
  const supersessions = await db
    .select({ newRef: schema.parts.referenceRaw, newName: schema.parts.name })
    .from(schema.supersessions)
    .innerJoin(schema.parts, eq(schema.parts.id, schema.supersessions.newPartId))
    .where(eq(schema.supersessions.oldPartId, part.id));

  // Offres vendeurs (une par vendeur, la plus récente)
  const allOffers = await db
    .select({ offer: schema.offers, seller: schema.sellers })
    .from(schema.offers)
    .innerJoin(schema.sellers, eq(schema.sellers.id, schema.offers.sellerId))
    .where(eq(schema.offers.partId, part.id));

  const bestBySeller = new Map<number, (typeof allOffers)[number]>();
  for (const r of allOffers) {
    const prev = bestBySeller.get(r.seller.id);
    if (!prev || r.offer.scrapedAt > prev.offer.scrapedAt) bestBySeller.set(r.seller.id, r);
  }

  const offers = [...bestBySeller.values()]
    .sort((a, b) => {
      const pa = a.offer.price != null ? Number(a.offer.price) : Infinity;
      const pb = b.offer.price != null ? Number(b.offer.price) : Infinity;
      return pa - pb;
    })
    .map(({ offer, seller }) => ({
      seller:       seller.name,
      sellerType:   seller.type,
      price:        offer.price != null ? Number(offer.price) : null,
      currency:     offer.currency,
      availability: offer.availability,
      url:          offer.url,
      scrapedAt:    offer.scrapedAt,
    }));

  const body = {
    reference:   part.referenceRaw,
    name:        part.name,
    description: part.description,
    status:      part.status,
    manufacturer: {
      name:     manufacturer.name,
      slug:     manufacturer.slug,
      industry: manufacturer.industry,
    },
    category:    category?.name ?? null,
    attributes:  part.attributes ?? {},
    productUrl:  part.productUrl,
    datasheetUrl: part.datasheetUrl,
    supersededBy: supersessions.length > 0
      ? { reference: supersessions[0].newRef, name: supersessions[0].newName }
      : null,
    offers,
    _meta: {
      plan:      auth.plan,
      pageUrl:   `${process.env.NEXT_PUBLIC_SITE_URL}/piece/${manufacturer.slug}/${part.slug}`,
      updatedAt: part.updatedAt,
    },
  };

  return NextResponse.json(body, { headers: API_CORS_HEADERS });
}
