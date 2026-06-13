import { NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeReference } from "@/lib/normalize";

const { parts, manufacturers, categories, offers, sellers, partReferences, supersessions } = schema;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const normalized = normalizeReference(ref);
  if (!normalized) {
    return Response.json({ error: "Invalid reference" }, { status: 400 });
  }

  // Try exact match on parts, then on part_references
  const [row] = await db
    .select({ part: parts, manufacturer: manufacturers, category: categories })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .leftJoin(categories, eq(categories.id, parts.categoryId))
    .where(eq(parts.referenceNormalized, normalized))
    .limit(1);

  if (!row) {
    // Fall back to cross-references
    const [xref] = await db
      .select({ partId: partReferences.partId })
      .from(partReferences)
      .where(eq(partReferences.referenceNormalized, normalized))
      .limit(1);
    if (!xref) {
      return Response.json({ error: "Part not found" }, { status: 404 });
    }
    const [row2] = await db
      .select({ part: parts, manufacturer: manufacturers, category: categories })
      .from(parts)
      .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
      .leftJoin(categories, eq(categories.id, parts.categoryId))
      .where(eq(parts.id, xref.partId))
      .limit(1);
    if (!row2) {
      return Response.json({ error: "Part not found" }, { status: 404 });
    }
    return buildResponse(row2.part, row2.manufacturer, row2.category);
  }

  return buildResponse(row.part, row.manufacturer, row.category);
}

async function buildResponse(
  part: typeof parts.$inferSelect,
  manufacturer: typeof manufacturers.$inferSelect,
  category: typeof categories.$inferSelect | null,
) {
  const [offerRows, supersessionRows, crossRefs] = await Promise.all([
    db
      .select({ offer: offers, seller: sellers })
      .from(offers)
      .innerJoin(sellers, eq(sellers.id, offers.sellerId))
      .where(eq(offers.partId, part.id)),
    db
      .select({ supersession: supersessions, newPart: parts, newManufacturer: manufacturers })
      .from(supersessions)
      .innerJoin(parts, eq(parts.id, supersessions.newPartId))
      .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
      .where(eq(supersessions.oldPartId, part.id)),
    db
      .select({ reference: partReferences.reference, type: partReferences.type, brand: partReferences.brand })
      .from(partReferences)
      .where(eq(partReferences.partId, part.id)),
  ]);

  return Response.json({
    id: part.id,
    referenceRaw: part.referenceRaw,
    referenceNormalized: part.referenceNormalized,
    name: part.name,
    description: part.description,
    status: part.status,
    manufacturer: {
      name: manufacturer.name,
      slug: manufacturer.slug,
      industry: manufacturer.industry,
    },
    category: category ? { name: category.name, slug: category.slug } : null,
    attributes: part.attributes ?? null,
    productUrl: part.productUrl ?? null,
    datasheetUrl: part.datasheetUrl ?? null,
    confidenceScore: part.confidenceScore ?? null,
    updatedAt: part.updatedAt,
    supersededBy: supersessionRows.map((s) => ({
      referenceRaw: s.newPart.referenceRaw,
      slug: s.newPart.slug,
      manufacturerSlug: s.newManufacturer.slug,
      status: s.newPart.status,
    })),
    crossReferences: crossRefs,
    offers: offerRows.map(({ offer, seller }) => ({
      sellerName: seller.name,
      sellerType: seller.type,
      price: offer.price ? parseFloat(offer.price) : null,
      currency: offer.currency ?? "EUR",
      availability: offer.availability ?? null,
      url: offer.url,
      scrapedAt: offer.scrapedAt,
    })),
  });
}
