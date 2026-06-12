import { NextRequest } from "next/server";
import { searchService } from "@/lib/search/postgres-search";
import { getManufacturersSuggestions } from "@/lib/queries";

export const runtime = "nodejs";

/** Autocomplétion de la barre de recherche : pièces (6 max) + marques (3 max). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ hits: [], brands: [] });

  try {
    const [hits, brands] = await Promise.all([
      searchService.search(q, { limit: 6 }),
      getManufacturersSuggestions(q, 3),
    ]);
    return Response.json(
      {
        hits: hits.map((h) => ({
          name: h.name,
          referenceRaw: h.referenceRaw,
          manufacturerName: h.manufacturerName,
          status: h.status,
          url: `/piece/${h.manufacturerSlug}/${h.slug}`,
        })),
        brands: brands.map((b) => ({
          name: b.name,
          url: `/marque/${b.slug}`,
        })),
      },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch {
    return Response.json({ hits: [], brands: [] });
  }
}
