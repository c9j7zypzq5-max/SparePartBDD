import { NextRequest, NextResponse } from "next/server";
import { checkApiKey, apiError, quotaHeaders, API_CORS_HEADERS } from "@/lib/api-auth";
import { searchService } from "@/lib/search/postgres-search";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.status, auth.message);

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return apiError(400, "Paramètre 'q' requis.");

  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset   = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);
  const industry = searchParams.get("industry") ?? undefined;
  const status   = searchParams.get("status") ?? undefined;
  const mfg      = searchParams.get("manufacturer") ?? undefined;
  const sortBy   = (searchParams.get("sort") ?? "relevance") as "relevance" | "price_asc" | "price_desc" | "name_asc";

  const hits = await searchService.search(q, {
    limit, offset, industry, status,
    manufacturerSlug: mfg,
    sortBy: ["relevance", "price_asc", "price_desc", "name_asc"].includes(sortBy) ? sortBy : "relevance",
  });

  const body = {
    query:   q,
    total:   hits.length,
    offset,
    results: hits.map((h) => ({
      reference:        h.referenceRaw,
      name:             h.name,
      status:           h.status,
      manufacturer:     h.manufacturerName,
      industry:         h.industry,
      score:            Math.round(h.score * 100) / 100,
      pageUrl:          `${process.env.NEXT_PUBLIC_SITE_URL}/piece/${h.manufacturerSlug}/${h.slug}`,
    })),
    _meta: { plan: auth.plan },
  };

  return NextResponse.json(body, { headers: quotaHeaders(auth) });
}
