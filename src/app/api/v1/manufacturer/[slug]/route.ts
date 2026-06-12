import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { checkApiKey, apiError, quotaHeaders, API_CORS_HEADERS } from "@/lib/api-auth";

export const runtime = "nodejs";

type Params = Promise<{ slug: string }>;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.status, auth.message);

  const { slug } = await params;
  const { searchParams } = req.nextUrl;
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);
  const status = searchParams.get("status") ?? undefined;

  const [mfg] = await db
    .select()
    .from(schema.manufacturers)
    .where(eq(schema.manufacturers.slug, slug))
    .limit(1);

  if (!mfg) return apiError(404, `Fabricant introuvable : ${slug}`);

  const conditions = [eq(schema.parts.manufacturerId, mfg.id)];
  if (status === "active" || status === "obsolete" || status === "unknown") {
    conditions.push(eq(schema.parts.status, status));
  }

  const partsRows = await db
    .select({
      reference: schema.parts.referenceRaw,
      name:      schema.parts.name,
      status:    schema.parts.status,
      category:  schema.categories.name,
      slug:      schema.parts.slug,
      updatedAt: schema.parts.updatedAt,
    })
    .from(schema.parts)
    .leftJoin(schema.categories, eq(schema.categories.id, schema.parts.categoryId))
    .where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.parts)
    .where(eq(schema.parts.manufacturerId, mfg.id));

  const body = {
    manufacturer: { name: mfg.name, slug: mfg.slug, industry: mfg.industry, website: mfg.website },
    total:  Number(countRow?.n ?? 0),
    offset,
    limit,
    parts:  partsRows.map((p) => ({
      reference: p.reference,
      name:      p.name,
      status:    p.status,
      category:  p.category,
      pageUrl:   `${process.env.NEXT_PUBLIC_SITE_URL}/piece/${mfg.slug}/${p.slug}`,
    })),
    _meta: { plan: auth.plan },
  };

  return NextResponse.json(body, { headers: quotaHeaders(auth) });
}
