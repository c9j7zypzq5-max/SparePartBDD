/**
 * Abstraction du moteur de recherche.
 *
 * Le MVP utilise PostgreSQL (full-text + pg_trgm). Quand le volume ou les
 * besoins de pertinence le justifieront, une implémentation Meilisearch ou
 * Typesense pourra remplacer PostgresSearchService sans toucher aux pages.
 */
import { industryEnum, partStatusEnum } from "@/db/schema";
import { enumParam, intParam } from "@/lib/params";

export const SEARCH_SORTS = ["relevance", "price_asc", "price_desc", "name_asc"] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];
export type SearchIndustry = (typeof industryEnum.enumValues)[number];
export type SearchStatus = (typeof partStatusEnum.enumValues)[number];

export const SEARCH_MAX_LIMIT = 100;
export const SEARCH_MAX_OFFSET = 10_000;

export interface SearchHit {
  partId: number;
  name: string;
  referenceRaw: string;
  slug: string;
  status: SearchStatus;
  manufacturerName: string;
  manufacturerSlug: string;
  industry: string;
  /** Score de pertinence relatif (plus haut = meilleur) */
  score: number;
  updatedAt?: Date;
}

export interface SearchOptions {
  limit?: number;
  /** Décalage pour la pagination (OFFSET SQL) */
  offset?: number;
  /** Restreint à une industrie (valeur de l'enum, ex : "industrie") */
  industry?: SearchIndustry;
  /** Restreint au statut de fabrication */
  status?: SearchStatus;
  /** Restreint à un fabricant (slug) */
  manufacturerSlug?: string;
  /** Restreint à une catégorie (slug) */
  categorySlug?: string;
  /** Tri des résultats */
  sortBy?: SearchSort;
  /** Si true, restreint aux pièces ayant au moins une offre avec un prix */
  inStock?: boolean;
}

export interface SearchService {
  /**
   * Recherche par référence (exacte ou approchée) ou par nom de pièce.
   * La requête peut être "6ES7214-1AG40", "Cisco PWR-C1-715WAC" ou
   * "variateur 1,5 kW".
   */
  search(query: string, options?: SearchOptions): Promise<SearchHit[]>;
}

/**
 * Construit des SearchOptions validées depuis des paramètres d'URL. Les noms
 * de paramètres diffèrent entre /recherche (français) et l'API v1 (anglais).
 */
export function searchOptionsFromParams(
  params: { get(name: string): string | null },
  names: {
    industry: string;
    status: string;
    manufacturer: string;
    category?: string;
    sort: string;
    inStock: string;
  },
  defaults: { limit: number },
): SearchOptions {
  const inStock = params.get(names.inStock);
  return {
    limit: intParam(params.get("limit"), { fallback: defaults.limit, min: 1, max: SEARCH_MAX_LIMIT }),
    offset: intParam(params.get("offset"), { fallback: 0, min: 0, max: SEARCH_MAX_OFFSET }),
    industry: enumParam(params.get(names.industry), industryEnum.enumValues),
    status: enumParam(params.get(names.status), partStatusEnum.enumValues),
    manufacturerSlug: params.get(names.manufacturer) || undefined,
    categorySlug: names.category ? params.get(names.category) || undefined : undefined,
    sortBy: enumParam(params.get(names.sort), SEARCH_SORTS) ?? "relevance",
    inStock: inStock === "1" || inStock === "true" || undefined,
  };
}
