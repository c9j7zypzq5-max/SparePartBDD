import { NextRequest } from "next/server";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;

export interface RepairPart {
  id: number;
  manufacturer: string;
  reference: string;
  industry: string;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  productUrl: string | null;
  attributes: Record<string, string> | null;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.INGEST_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "INGEST_API_KEY non configurée côté serveur" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${apiKey}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const incompleteCondition = or(
    isNull(schema.parts.description),
    sql`${schema.parts.description} = ''`,
    isNull(schema.parts.productUrl),
    sql`${schema.parts.productUrl} = ''`,
    eq(schema.parts.status, "unknown"),
    isNull(schema.parts.categoryId),
  );

  const rows = await db
    .select({
      id: schema.parts.id,
      manufacturer: schema.manufacturers.name,
      reference: schema.parts.referenceRaw,
      industry: schema.manufacturers.industry,
      name: schema.parts.name,
      description: schema.parts.description,
      category: schema.categories.name,
      status: schema.parts.status,
      productUrl: schema.parts.productUrl,
      attributes: schema.parts.attributes,
    })
    .from(schema.parts)
    .innerJoin(
      schema.manufacturers,
      eq(schema.parts.manufacturerId, schema.manufacturers.id),
    )
    .leftJoin(
      schema.categories,
      eq(schema.parts.categoryId, schema.categories.id),
    )
    .where(and(incompleteCondition))
    .orderBy(schema.parts.id)
    .limit(limit);

  const parts: RepairPart[] = rows.map((r) => ({
    id: r.id,
    manufacturer: r.manufacturer,
    reference: r.reference,
    industry: r.industry,
    name: r.name,
    description: r.description ?? null,
    category: r.category ?? null,
    status: r.status,
    productUrl: r.productUrl ?? null,
    attributes: (r.attributes as Record<string, string> | null) ?? null,
  }));

  return Response.json({ parts });
}
