import { NextRequest } from "next/server";
import { and, eq, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

export interface VerifyPart {
  id: number;
  reference: string;
  manufacturer: string;
  productUrl: string;
}

/**
 * GET /api/verify/parts — pièces dont la productUrl doit être vérifiée.
 *
 * Renvoie les pièces :
 *   - jamais vérifiées (urlVerifiedAt IS NULL), en premier,
 *   - puis vérifiées il y a plus de ?days jours (défaut : 7).
 *
 * Auth : Bearer INGEST_API_KEY
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.INGEST_API_KEY;
  if (!apiKey) return Response.json({ error: "INGEST_API_KEY non configurée" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${apiKey}`)
    return Response.json({ error: "Non autorisé" }, { status: 401 });

  const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(1, Math.trunc(rawLimit)), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const days = Number(req.nextUrl.searchParams.get("days") ?? 7);
  const staleBefore = sql`NOW() - INTERVAL '${sql.raw(String(Math.max(1, Math.trunc(days))))} days'`;

  const rows = await db
    .select({
      id: schema.parts.id,
      reference: schema.parts.referenceRaw,
      manufacturer: schema.manufacturers.name,
      productUrl: schema.parts.productUrl,
    })
    .from(schema.parts)
    .innerJoin(schema.manufacturers, eq(schema.parts.manufacturerId, schema.manufacturers.id))
    .where(
      and(
        isNotNull(schema.parts.productUrl),
        or(
          isNull(schema.parts.urlVerifiedAt),
          lt(schema.parts.urlVerifiedAt, staleBefore),
        ),
      ),
    )
    .orderBy(sql`${schema.parts.urlVerifiedAt} ASC NULLS FIRST`)
    .limit(limit);

  return Response.json({
    parts: rows as VerifyPart[],
    total: rows.length,
  });
}
