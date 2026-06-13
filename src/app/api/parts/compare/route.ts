import { NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const { manufacturers, offers, parts } = schema;

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
  if (!rateLimit(getClientIp(req.headers), { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
    normalized: item.reference.toUpperCase().replace(/[^A-Z0-9]/g, ""),
  }));

  const normalizedRefs = [...new Set(items.map((i) => i.normalized))];

  // Batch query — une seule requête pour toutes les références
  const rows = await db
    .select({
      part: parts,
      manufacturer: manufacturers,
      minPrice: sql<string | null>`min(${offers.price})`,
      currency: sql<string | null>`max(${offers.currency})`,
    })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .leftJoin(offers, eq(offers.partId, parts.id))
    .where(inArray(parts.referenceNormalized, normalizedRefs))
    .groupBy(parts.id, manufacturers.id);

  const rowMap = new Map(rows.map((r) => [r.part.referenceNormalized, r]));

  const results: CompareResult[] = items.map((item) => {
    const row = rowMap.get(item.normalized);

    if (!row) {
      return { reference: item.reference, found: false, current: null, changes: [] };
    }

    const currentMinPrice = row.minPrice !== null ? parseFloat(row.minPrice) : undefined;
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
        currency: row.currency ?? "EUR",
      },
      changes,
    };
  });

  return NextResponse.json(results);
}
