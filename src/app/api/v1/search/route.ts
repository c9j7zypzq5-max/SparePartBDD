import { NextRequest } from "next/server";
import { searchService } from "@/lib/search/postgres-search";
import type { SearchOptions } from "@/lib/search/search-service";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  if (!q) {
    return Response.json({ error: "q parameter is required" }, { status: 400 });
  }

  const limit = Math.min(Number(sp.get("limit") ?? 20), 50);
  const offset = Math.max(Number(sp.get("offset") ?? 0), 0);
  const options: SearchOptions = {
    limit,
    offset,
    industry: sp.get("industry") ?? undefined,
    status: sp.get("status") ?? undefined,
    manufacturerSlug: sp.get("manufacturer") ?? undefined,
    sortBy: (sp.get("sort") as SearchOptions["sortBy"]) ?? "relevance",
    inStock: sp.get("inStock") === "true" ? true : undefined,
  };

  const hits = await searchService.search(q, options);

  return Response.json({
    query: q,
    total: hits.length,
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
  });
}
