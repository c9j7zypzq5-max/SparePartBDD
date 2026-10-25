import { NextRequest } from "next/server";
import { searchService } from "@/lib/search/postgres-search";
import { rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Autocomplétion de la barre de recherche (6 suggestions max). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ hits: [] });

  // Une requête par frappe (debounce 250 ms côté client) : limite large.
  const limited = rateLimitResponse(req, "suggest", { limit: 120 });
  if (limited) return limited;

  try {
    const hits = await searchService.search(q, { limit: 6 });
    return Response.json(
      {
        hits: hits.map((h) => ({
          name: h.name,
          referenceRaw: h.referenceRaw,
          manufacturerName: h.manufacturerName,
          status: h.status,
          url: `/piece/${h.manufacturerSlug}/${h.slug}`,
        })),
      },
      // s-maxage : mise en cache partagée sur le CDN Vercel, pas seulement dans le navigateur.
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch {
    return Response.json({ error: "Search unavailable" }, { status: 500 });
  }
}
