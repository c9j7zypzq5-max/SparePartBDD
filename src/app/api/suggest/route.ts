import { NextRequest } from "next/server";
import { searchService } from "@/lib/search/postgres-search";
import { getManufacturersSuggestions } from "@/lib/queries";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Autocomplétion de la barre de recherche : pièces (6 max) + marques (3 max). */
export async function GET(req: NextRequest) {
  // L'autocomplétion tire une requête BDD par frappe : 60 / minute / IP
  const rl = rateLimit(`suggest:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return tooManyRequests(rl);

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
