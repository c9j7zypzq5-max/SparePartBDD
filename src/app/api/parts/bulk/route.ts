import { NextRequest } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { parts, manufacturers, offers } = schema;

export async function POST(req: NextRequest) {
  let refs: string[];
  try {
    refs = await req.json();
    if (!Array.isArray(refs) || refs.length === 0) {
      return Response.json({ error: "refs must be a non-empty array" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const normalized = refs
    .slice(0, 50)
    .map((r) => String(r).replace(/[^A-Z0-9]/gi, "").toUpperCase());

  const rows = await db
    .select({
      referenceNormalized: parts.referenceNormalized,
      referenceRaw: parts.referenceRaw,
      name: parts.name,
      slug: parts.slug,
      status: parts.status,
      manufacturerName: manufacturers.name,
      manufacturerSlug: manufacturers.slug,
    })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .where(inArray(parts.referenceNormalized, normalized));

  const partIds = await db
    .select({ id: parts.id, referenceNormalized: parts.referenceNormalized })
    .from(parts)
    .where(inArray(parts.referenceNormalized, normalized));

  const idMap = new Map(partIds.map((p) => [p.referenceNormalized, p.id]));
  const allIds = [...idMap.values()];

  const minPrices =
    allIds.length > 0
      ? await db
          .select({
            partId: offers.partId,
            minPrice: sql<string>`min(${offers.price})`,
            currency: offers.currency,
          })
          .from(offers)
          .where(inArray(offers.partId, allIds))
          .groupBy(offers.partId, offers.currency)
      : [];

  const priceMap = new Map(minPrices.map((o) => [o.partId, { minPrice: o.minPrice, currency: o.currency }]));
  const rowMap = new Map(rows.map((r) => [r.referenceNormalized, r]));

  const results = normalized.map((norm, i) => {
    const row = rowMap.get(norm);
    if (!row) return { inputRef: refs[i], found: false };
    const partId = idMap.get(norm);
    const priceData = partId ? priceMap.get(partId) : undefined;
    return {
      inputRef: refs[i],
      found: true,
      referenceRaw: row.referenceRaw,
      name: row.name,
      manufacturerName: row.manufacturerName,
      manufacturerSlug: row.manufacturerSlug,
      slug: row.slug,
      status: row.status,
      minPrice: priceData?.minPrice ? parseFloat(priceData.minPrice) : undefined,
      currency: priceData?.currency ?? "EUR",
    };
  });

  return Response.json(results);
}
