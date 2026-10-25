import { NextRequest } from "next/server";
import { searchService } from "@/lib/search/postgres-search";
import { searchOptionsFromParams } from "@/lib/search/search-service";
import { rateLimitResponse } from "@/lib/rate-limit";

const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  const limited = rateLimitResponse(req, "v1-search", { limit: 60 });
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  if (!q) {
    return Response.json({ error: "q parameter is required" }, { status: 400 });
  }

  const options = searchOptionsFromParams(
    sp,
    {
      industry: "industry",
      status: "status",
      manufacturer: "manufacturer",
      category: "category",
      sort: "sort",
      inStock: "inStock",
    },
    { limit: 20 },
  );
  options.limit = Math.min(options.limit ?? 20, MAX_LIMIT);

  const hits = await searchService.search(q, options);

  return Response.json(
    {
      query: q,
      // Nombre de résultats de cette page (pas le total, qui n'est pas calculé).
      total: hits.length,
      limit: options.limit,
      offset: options.offset,
      results: hits.map((h) => ({
        partId: h.partId,
        referenceRaw: h.referenceRaw,
        name: h.name,
        status: h.status,
        manufacturer: {
          name: h.manufacturerName,
          slug: h.manufacturerSlug,
          industry: h.industry,
        },
        score: h.score,
        updatedAt: h.updatedAt,
        url: `/piece/${h.manufacturerSlug}/${h.slug}`,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
