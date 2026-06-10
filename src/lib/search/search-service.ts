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

export interface SearchOptions {
  limit?: number;
  /** Décalage pour la pagination (OFFSET SQL) */
  offset?: number;
  /** Restreint à une industrie (slug de l'enum, ex : "industrie") */
  industry?: string;
  /** Restreint au statut de fabrication ("active" | "obsolete") */
  status?: string;
  /** Restreint à un fabricant (slug) */
  manufacturerSlug?: string;
}

export interface SearchService {
  /**
   * Recherche par référence (exacte ou approchée) ou par nom de pièce.
   * La requête peut être "6ES7214-1AG40", "Cisco PWR-C1-715WAC" ou
   * "variateur 1,5 kW".
   */
  search(query: string, options?: SearchOptions): Promise<SearchHit[]>;
}
