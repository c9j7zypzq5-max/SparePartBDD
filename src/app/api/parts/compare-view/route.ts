import { NextRequest } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCheapestOffers } from "@/lib/queries";
import { rateLimitResponse } from "@/lib/rate-limit";

const { parts, manufacturers, categories, offers } = schema;

type Item = { manufacturerSlug: string; slug: string };

/** Données de la page /comparer (1 à 3 pièces). */
export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, "parts-compare-view", { limit: 30 });
  if (limited) return limited;

  let items: unknown;
  try {
    items = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 3 ||
    !items.every((i): i is Item => typeof i?.manufacturerSlug === "string" && typeof i?.slug === "string")
  ) {
    return Response.json({ error: "Expected 1-3 items" }, { status: 400 });
  }

  const results = await Promise.all(
    items.map(async ({ manufacturerSlug, slug }) => {
      const [row] = await db
        .select({
          part: parts,
          manufacturer: manufacturers,
          category: categories,
          offerCount: sql<number>`(SELECT count(*)::int FROM offers o WHERE o.part_id = ${parts.id})`,
        })
        .from(parts)
        .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
        .leftJoin(categories, eq(categories.id, parts.categoryId))
        .where(and(eq(manufacturers.slug, manufacturerSlug), eq(parts.slug, slug)))
        .limit(1);

      if (!row) return null;

      const [cheapest, sellerRows] = await Promise.all([
        getCheapestOffers([row.part.id]),
        db
          .select({ url: offers.url, price: offers.price, currency: offers.currency })
          .from(offers)
          .where(eq(offers.partId, row.part.id))
          .orderBy(sql`${asc(offers.price)} NULLS LAST`)
          .limit(5),
      ]);
      const offer = cheapest.get(row.part.id);

      return {
        referenceRaw: row.part.referenceRaw,
        name: row.part.name,
        manufacturerName: row.manufacturer.name,
        manufacturerSlug: row.manufacturer.slug,
        slug: row.part.slug,
        categoryName: row.category?.name ?? null,
        status: row.part.status,
        attributes: row.part.attributes ?? null,
        minPrice: offer?.price ?? null,
        offerCount: row.offerCount,
        currency: offer?.currency ?? "EUR",
        offerUrls: sellerRows.map((o) => ({
          url: o.url,
          price: o.price ? parseFloat(o.price) : null,
          currency: o.currency ?? "EUR",
        })),
      };
    }),
  );

  return Response.json(results);
}
