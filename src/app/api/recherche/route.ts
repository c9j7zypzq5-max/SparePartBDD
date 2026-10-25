import { type NextRequest, NextResponse } from "next/server";
import { searchService } from "@/lib/search/postgres-search";
import { searchOptionsFromParams } from "@/lib/search/search-service";
import { rateLimitResponse } from "@/lib/rate-limit";

/** « Charger plus » de la page /recherche : mêmes paramètres que l'URL de la page. */
export async function GET(request: NextRequest) {
  const limited = rateLimitResponse(request, "recherche", { limit: 60 });
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json([]);

  const options = searchOptionsFromParams(
    searchParams,
    {
      industry: "industrie",
      status: "statut",
      manufacturer: "marque",
      category: "categorie",
      sort: "sort",
      inStock: "stock",
    },
    { limit: 21 },
  );

  const hits = await searchService.search(q, options);
  return NextResponse.json(hits);
}
