import { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeReference } from "@/lib/normalize";

const { parts, manufacturers, categories, offers } = schema;

/** Entrée par slugs (liste de comparaison locale) ou par référence (?refs= partagé). */
type CompareItem =
  | { manufacturerSlug: string; slug: string }
  | { reference: string };

export async function POST(req: NextRequest) {
  let items: CompareItem[];
  try {
    items = await req.json();
    if (!Array.isArray(items) || items.length === 0 || items.length > 3) {
      return Response.json({ error: "Expected 1-3 items" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const results = await Promise.all(
    items.map(async (item) => {
      const baseQuery = db
        .select({
          part: parts,
          manufacturer: manufacturers,
          category: categories,
        })
        .from(parts)
        .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
        .leftJoin(categories, eq(categories.id, parts.categoryId));

      const [row] =
        "reference" in item
          ? await baseQuery
              .where(eq(parts.referenceNormalized, normalizeReference(item.reference)))
              .limit(1)
          : await baseQuery
              .where(
                and(
                  eq(manufacturers.slug, item.manufacturerSlug),
                  eq(parts.slug, item.slug),
                ),
              )
              .limit(1);

      if (!row) return null;

      const [offerStats] = await db
        .select({
          count: sql<number>`count(*)::int`,
          minPrice: sql<string>`min(${offers.price})`,
          currency: offers.currency,
        })
        .from(offers)
        .where(eq(offers.partId, row.part.id))
        .groupBy(offers.currency)
        .orderBy(sql`min(${offers.price}) asc`)
        .limit(1);

      const sellerRows = await db
        .select({ url: offers.url, price: offers.price, currency: offers.currency })
        .from(offers)
        .where(eq(offers.partId, row.part.id))
        .orderBy(sql`${offers.price} asc nulls last`)
        .limit(5);

      return {
        referenceRaw: row.part.referenceRaw,
        name: row.part.name,
        manufacturerName: row.manufacturer.name,
        manufacturerSlug: row.manufacturer.slug,
        slug: row.part.slug,
        categoryName: row.category?.name ?? null,
        status: row.part.status,
        attributes: (row.part.attributes as Record<string, string> | null) ?? null,
        minPrice: offerStats?.minPrice ? parseFloat(offerStats.minPrice) : null,
        offerCount: offerStats?.count ?? 0,
        currency: offerStats?.currency ?? "EUR",
        offerUrls: sellerRows.map((o) => ({ url: o.url, price: o.price ? parseFloat(o.price) : null, currency: o.currency ?? "EUR" })),
      };
    }),
  );

  return Response.json(results);
}
