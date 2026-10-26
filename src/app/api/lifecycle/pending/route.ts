import { NextRequest } from "next/server";
import { and, asc, eq, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { LifecyclePendingPart } from "@/lib/lifecycle-types";
import { requireApiKey } from "@/lib/api-auth";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

/**
 * Liste les pièces dues pour un contrôle de cycle de vie : URL produit
 * renseignée, pas déjà obsolètes (état terminal), jamais contrôlées ou
 * contrôlées il y a plus de 7 jours. Consommé par scripts/lifecycle/check.ts.
 */
export async function GET(req: NextRequest) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const dueBefore = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const rows = await db
    .select({
      id: schema.parts.id,
      manufacturer: schema.manufacturers.name,
      reference: schema.parts.referenceRaw,
      productUrl: schema.parts.productUrl,
      status: schema.parts.status,
      lifecycleCheckedAt: schema.parts.lifecycleCheckedAt,
    })
    .from(schema.parts)
    .innerJoin(
      schema.manufacturers,
      eq(schema.parts.manufacturerId, schema.manufacturers.id),
    )
    .where(
      and(
        isNotNull(schema.parts.productUrl),
        ne(schema.parts.status, "obsolete"),
        or(
          isNull(schema.parts.lifecycleCheckedAt),
          lt(schema.parts.lifecycleCheckedAt, dueBefore),
        ),
      ),
    )
    .orderBy(sql`${asc(schema.parts.lifecycleCheckedAt)} NULLS FIRST`)
    .limit(limit);

  const parts: LifecyclePendingPart[] = rows.map((r) => ({
    id: r.id,
    manufacturer: r.manufacturer,
    reference: r.reference,
    productUrl: r.productUrl as string,
    status: r.status,
    lifecycleCheckedAt: r.lifecycleCheckedAt?.toISOString() ?? null,
  }));

  return Response.json({ parts });
}
