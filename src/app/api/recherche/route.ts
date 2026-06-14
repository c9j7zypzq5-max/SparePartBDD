import { type NextRequest, NextResponse } from "next/server";
import { searchService } from "@/lib/search/postgres-search";
import type { SearchOptions } from "@/lib/search/search-service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json([]);

  const limit = 21;
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  const options: SearchOptions = {
    limit,
    offset,
    industry: searchParams.get("industrie") || undefined,
    status: searchParams.get("statut") || undefined,
    manufacturerSlug: searchParams.get("marque") || undefined,
    categorySlug: searchParams.get("categorie") || undefined,
    sortBy: (searchParams.get("sort") as SearchOptions["sortBy"]) || "relevance",
    inStock: searchParams.get("stock") === "1" || undefined,
  };

  const hits = await searchService.search(q, options);
  return NextResponse.json(hits);
}
