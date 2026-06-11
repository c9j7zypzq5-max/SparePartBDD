import { sql } from "drizzle-orm";
import { db } from "@/db";
import { normalizeReference } from "@/lib/normalize";
import type { SearchHit, SearchOptions, SearchService } from "./search-service";

/**
 * Implémentation MVP de la recherche sur PostgreSQL :
 *  - matching de référence exact puis approché (pg_trgm) sur la référence
 *    normalisée des pièces ET des cross-references ;
 *  - full-text sur le nom et la description pour les requêtes en langage
 *    naturel.
 *
 * Les deux scores sont combinés : un match de référence domine toujours un
 * match textuel.
 */
export class PostgresSearchService implements SearchService {
  async search(query: string, options: SearchOptions = {}): Promise<SearchHit[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const normalizedRef = normalizeReference(trimmed);
    const industryFilter = options.industry
      ? sql` AND m.industry::text = ${options.industry}`
      : sql``;
    const statusFilter = options.status
      ? sql` AND p.status::text = ${options.status}`
      : sql``;
    const manufacturerFilter = options.manufacturerSlug
      ? sql` AND m.slug = ${options.manufacturerSlug}`
      : sql``;

    const sortBy = options.sortBy ?? "relevance";
    let orderClause;
    switch (sortBy) {
      case "price_asc":
        orderClause = sql`ORDER BY (SELECT MIN(price::numeric) FROM offers WHERE part_id = p.id) ASC NULLS LAST`;
        break;
      case "price_desc":
        orderClause = sql`ORDER BY (SELECT MIN(price::numeric) FROM offers WHERE part_id = p.id) DESC NULLS LAST`;
        break;
      case "name_asc":
        orderClause = sql`ORDER BY p.name ASC`;
        break;
      default:
        orderClause = sql`ORDER BY score DESC`;
    }

    const rows = await db.execute(sql`
      WITH ref_matches AS (
        SELECT p.id,
               GREATEST(
                 CASE WHEN p.reference_normalized = ${normalizedRef} THEN 1.0
                      ELSE similarity(p.reference_normalized, ${normalizedRef})
                 END,
                 COALESCE((
                   SELECT MAX(
                     CASE WHEN pr.reference_normalized = ${normalizedRef} THEN 1.0
                          ELSE similarity(pr.reference_normalized, ${normalizedRef})
                     END)
                   FROM part_references pr
                   WHERE pr.part_id = p.id
                 ), 0)
               ) AS ref_score
        FROM parts p
      ),
      text_matches AS (
        SELECT p.id,
               ts_rank(
                 to_tsvector('french', p.name || ' ' || COALESCE(p.description, '')),
                 websearch_to_tsquery('french', ${trimmed})
               ) AS text_score
        FROM parts p
      )
      SELECT p.id AS part_id,
             p.name,
             p.reference_raw,
             p.slug,
             p.status,
             p.updated_at,
             m.name AS manufacturer_name,
             m.slug AS manufacturer_slug,
             m.industry,
             (rm.ref_score * 10 + COALESCE(tm.text_score, 0)) AS score
      FROM parts p
      JOIN manufacturers m ON m.id = p.manufacturer_id
      JOIN ref_matches rm ON rm.id = p.id
      LEFT JOIN text_matches tm ON tm.id = p.id
      WHERE (rm.ref_score > 0.3 OR COALESCE(tm.text_score, 0) > 0.01)${industryFilter}${statusFilter}${manufacturerFilter}
      ${orderClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      partId: Number(r.part_id),
      name: String(r.name),
      referenceRaw: String(r.reference_raw),
      slug: String(r.slug),
      status: r.status as SearchHit["status"],
      manufacturerName: String(r.manufacturer_name),
      manufacturerSlug: String(r.manufacturer_slug),
      industry: String(r.industry),
      score: Number(r.score),
      updatedAt: r.updated_at ? new Date(r.updated_at as string | Date) : undefined,
    }));
  }
}

export const searchService: SearchService = new PostgresSearchService();
