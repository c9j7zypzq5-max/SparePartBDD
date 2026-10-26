import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeReference } from "@/lib/normalize";
import { getCheapestOffers } from "@/lib/queries";
import { rateLimitResponse } from "@/lib/rate-limit";

const { manufacturers, parts } = schema;

type InputItem = {
  reference: string;
  manufacturer: string;
  status: string;
  minPrice?: number;
  currency?: string;
  snapshotDate: string;
};

type CompareResult = {
  reference: string;
  found: boolean;
  current: {
    reference: string;
    manufacturer: string;
    manufacturerSlug: string;
    partSlug: string;
    name: string;
    status: string;
    minPrice?: number;
    currency?: string;
  } | null;
  changes: string[];
};

export async function POST(req: Request) {
  const limited = rateLimitResponse(req, "parts-compare", { limit: 30 });
  if (limited) return limited;

  let body: InputItem[];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ error: "Expected non-empty array" }, { status: 400 });
  }

  if (body.length > 50) {
    return NextResponse.json({ error: "Max 50 items per request" }, { status: 400 });
  }

  const items = body.map((item) => ({
    ...item,
    reference: String(item?.reference ?? ""),
    normalized: normalizeReference(String(item?.reference ?? "")),
  }));

  const normalizedRefs = [...new Set(items.map((i) => i.normalized).filter(Boolean))];

  // Une requête pour toutes les références, une pour leurs offres les moins chères
  const rows = normalizedRefs.length > 0
    ? await db
        .select({ part: parts, manufacturer: manufacturers })
        .from(parts)
        .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
        .where(inArray(parts.referenceNormalized, normalizedRefs))
    : [];
  const cheapest = await getCheapestOffers(rows.map((r) => r.part.id));

  const rowMap = new Map(rows.map((r) => [r.part.referenceNormalized, r]));

  const results: CompareResult[] = items.map((item) => {
    const row = rowMap.get(item.normalized);

    if (!row) {
      return { reference: item.reference, found: false, current: null, changes: [] };
    }

    const offer = cheapest.get(row.part.id);
    const currentMinPrice = offer?.price;
    const changes: string[] = [];

    if (row.part.status !== item.status) {
      changes.push(`statut : ${item.status} → ${row.part.status}`);
    }

    if (currentMinPrice !== undefined && item.minPrice !== undefined) {
      if (Math.abs(currentMinPrice - item.minPrice) > 0.01) {
        const curr = item.currency ?? "EUR";
        changes.push(`prix : ${item.minPrice}${curr} → ${currentMinPrice}${curr}`);
      }
    } else if (currentMinPrice !== undefined && item.minPrice === undefined) {
      changes.push("nouvelles offres disponibles");
    } else if (currentMinPrice === undefined && item.minPrice !== undefined) {
      changes.push("offres précédentes plus disponibles");
    }

    return {
      reference: item.reference,
      found: true,
      current: {
        reference: row.part.referenceRaw,
        manufacturer: row.manufacturer.name,
        manufacturerSlug: row.manufacturer.slug,
        partSlug: row.part.slug,
        name: row.part.name,
        status: row.part.status,
        minPrice: currentMinPrice,
        currency: offer?.currency ?? "EUR",
      },
      changes,
    };
  });

  return NextResponse.json(results);
}
