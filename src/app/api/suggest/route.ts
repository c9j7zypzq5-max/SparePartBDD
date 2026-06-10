import { NextRequest } from "next/server";
import { searchService } from "@/lib/search/postgres-search";

export const runtime = "nodejs";

/** Autocomplétion de la barre de recherche (6 suggestions max). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ hits: [] });

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
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch {
    return Response.json({ hits: [] });
  }
}
