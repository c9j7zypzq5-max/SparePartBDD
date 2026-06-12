import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { normalizeReference } from "@/lib/normalize";
import type { SearchHit, SearchOptions, SearchService } from "./search-service";

/**
 * Recherche PostgreSQL index-backed :
 *  - références exactes et approchées via l'opérateur % de pg_trgm (index GIN
 *    trigram sur parts.reference_normalized et part_references) ;
 *  - full-text français via la colonne générée parts.search_vector (index GIN)
 *    interrogée avec @@ websearch_to_tsquery.
 *
 * Les candidats sont d'abord restreints par les index, puis scorés : un match
 * de référence domine toujours un match textuel.
 *
 * Si la migration n'est pas encore appliquée (colonne search_vector ou index
 * absents), on retombe automatiquement sur l'ancienne requête séquentielle.
 */
export class PostgresSearchService implements SearchService {
  /** true tant que la requête indexée n'a pas échoué (colonne manquante…) */
  private indexedQueryAvailable = true;

  async search(query: string, options: SearchOptions = {}): Promise<SearchHit[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    if (this.indexedQueryAvailable) {
      try {
        return await this.searchIndexed(trimmed, options);
      } catch (err) {
        // Colonne search_vector absente (db:push pas encore lancé) : on ne
        // retente plus la requête indexée pour ce process.
        this.indexedQueryAvailable = false;
        console.warn(
          `[search] Requête indexée indisponible (${String(err).slice(0, 120)}) — fallback séquentiel. Lancez "npm run db:push".`,
        );
      }
    }
    return this.searchLegacy(trimmed, options);
  }

  private buildFilters(options: SearchOptions): SQL {
    const industryFilter = options.industry
      ? sql` AND m.industry::text = ${options.industry}`
      : sql``;
    const statusFilter = options.status
      ? sql` AND p.status::text = ${options.status}`
      : sql``;
    const manufacturerFilter = options.manufacturerSlug
      ? sql` AND m.slug = ${options.manufacturerSlug}`
      : sql``;
    return sql`${industryFilter}${statusFilter}${manufacturerFilter}`;
  }

  private buildOrderClause(sortBy: SearchOptions["sortBy"]): SQL {
    switch (sortBy) {
      case "price_asc":
        return sql`ORDER BY (SELECT MIN(price::numeric) FROM offers WHERE part_id = p.id) ASC NULLS LAST`;
      case "price_desc":
        return sql`ORDER BY (SELECT MIN(price::numeric) FROM offers WHERE part_id = p.id) DESC NULLS LAST`;
      case "name_asc":
        return sql`ORDER BY p.name ASC`;
      default:
        return sql`ORDER BY score DESC`;
    }
  }

  private mapRows(rows: unknown): SearchHit[] {
    return (rows as Record<string, unknown>[]).map((r) => ({
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

  /**
   * Requête principale : les CTE de candidats n'examinent que les lignes
   * retenues par les index GIN (trigram % et tsvector @@), le scoring fin
   * (similarity, ts_rank) n'est calculé que sur ce petit ensemble.
   */
  private async searchIndexed(trimmed: string, options: SearchOptions): Promise<SearchHit[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const normalizedRef = normalizeReference(trimmed);
    const filters = this.buildFilters(options);
    const orderClause = this.buildOrderClause(options.sortBy ?? "relevance");

    const rows = await db.execute(sql`
      WITH ref_candidates AS (
        SELECT id AS part_id
        FROM parts
        WHERE reference_normalized = ${normalizedRef}
           OR reference_normalized % ${normalizedRef}
        UNION
        SELECT part_id
        FROM part_references
        WHERE reference_normalized = ${normalizedRef}
           OR reference_normalized % ${normalizedRef}
      ),
      text_candidates AS (
        SELECT id AS part_id,
               ts_rank(search_vector, websearch_to_tsquery('french', ${trimmed})) AS text_score
        FROM parts
        WHERE search_vector @@ websearch_to_tsquery('french', ${trimmed})
      ),
      candidates AS (
        SELECT part_id FROM ref_candidates
        UNION
        SELECT part_id FROM text_candidates
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
             (GREATEST(
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
              ) * 10 + COALESCE(tc.text_score, 0)) AS score
      FROM candidates c
      JOIN parts p ON p.id = c.part_id
      JOIN manufacturers m ON m.id = p.manufacturer_id
      LEFT JOIN text_candidates tc ON tc.part_id = p.id
      WHERE TRUE${filters}
      ${orderClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return this.mapRows(rows);
  }

  /** Ancienne requête (scan complet) — repli tant que db:push n'est pas passé. */
  private async searchLegacy(trimmed: string, options: SearchOptions): Promise<SearchHit[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const normalizedRef = normalizeReference(trimmed);
    const filters = this.buildFilters(options);
    const orderClause = this.buildOrderClause(options.sortBy ?? "relevance");

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
      WHERE (rm.ref_score > 0.3 OR COALESCE(tm.text_score, 0) > 0.01)${filters}
      ${orderClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return this.mapRows(rows);
  }
}

export const searchService: SearchService = new PostgresSearchService();
