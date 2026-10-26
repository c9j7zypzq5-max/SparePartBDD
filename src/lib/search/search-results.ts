import { getPartCardExtras, type PartCardExtras } from "@/lib/queries";
import type { SearchHit } from "./search-service";

export type SearchResult = SearchHit & { extras: PartCardExtras };

/** Résultats complétés de ce qu'affichent les cartes : prix, offres, remplacement. */
export async function withCardExtras(hits: SearchHit[]): Promise<SearchResult[]> {
  const extras = await getPartCardExtras(hits.map((h) => ({ id: h.partId, status: h.status })));
  return hits.map((h) => ({ ...h, extras: extras.get(h.partId)! }));
}
