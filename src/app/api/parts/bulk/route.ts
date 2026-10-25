import { NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeReference } from "@/lib/normalize";
import { getCheapestOffers } from "@/lib/queries";
import { rateLimitResponse } from "@/lib/rate-limit";

const { parts, manufacturers } = schema;

const MAX_REFS = 50;

/** Recherche en lot par référence exacte (pages /technicien et /recherche-lot). */
export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, "parts-bulk", { limit: 10 });
  if (limited) return limited;

  let refs: unknown;
  try {
    refs = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(refs) || refs.length === 0) {
    return Response.json({ error: "refs must be a non-empty array" }, { status: 400 });
  }

  const inputs = refs.slice(0, MAX_REFS).map((r) => String(r));
  const normalized = inputs.map(normalizeReference);
  const lookup = [...new Set(normalized.filter(Boolean))];

  const rows = lookup.length > 0
    ? await db
        .select({
          id: parts.id,
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
        .where(inArray(parts.referenceNormalized, lookup))
    : [];

  const cheapest = await getCheapestOffers(rows.map((r) => r.id));
  const rowMap = new Map(rows.map((r) => [r.referenceNormalized, r]));

  const results = normalized.map((norm, i) => {
    const row = rowMap.get(norm);
    if (!row) return { inputRef: inputs[i], found: false };
    const offer = cheapest.get(row.id);
    return {
      inputRef: inputs[i],
      found: true,
      referenceRaw: row.referenceRaw,
      name: row.name,
      manufacturerName: row.manufacturerName,
      manufacturerSlug: row.manufacturerSlug,
      slug: row.slug,
      status: row.status,
      minPrice: offer?.price,
      currency: offer?.currency ?? "EUR",
    };
  });

  return Response.json(results);
}
