/**
 * Abstraction du moteur de recherche.
 *
 * Le MVP utilise PostgreSQL (full-text + pg_trgm). Quand le volume ou les
 * besoins de pertinence le justifieront, une implémentation Meilisearch ou
 * Typesense pourra remplacer PostgresSearchService sans toucher aux pages.
 */

export interface SearchHit {
  partId: number;
  name: string;
  referenceRaw: string;
  slug: string;
  status: "active" | "obsolete" | "unknown";
  manufacturerName: string;
  manufacturerSlug: string;
  industry: string;
  /** Score de pertinence relatif (plus haut = meilleur) */
  score: number;
}

export interface SearchService {
  /**
   * Recherche par référence (exacte ou approchée) ou par nom de pièce.
   * La requête peut être "00754870", "BMW 11427953129" ou "filtre à huile".
   */
  search(query: string, limit?: number): Promise<SearchHit[]>;
}
