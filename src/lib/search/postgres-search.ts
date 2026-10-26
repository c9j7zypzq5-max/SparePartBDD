import { sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { searchDocument } from "@/db/search-document";
import { parseSearchQuery, type BrandRef } from "./query-parser";
import {
  SEARCH_MAX_LIMIT,
  SEARCH_MAX_OFFSET,
  type SearchHit,
  type SearchOptions,
  type SearchService,
} from "./search-service";

type SearchRow = {
  part_id: number;
  name: string;
  reference_raw: string;
  slug: string;
  status: string;
  updated_at: Date | string | null;
  manufacturer_name: string;
  manufacturer_slug: string;
  industry: string;
  score: number;
};

/** Bonus ajouté aux pièces du fabricant nommé dans la requête ("Siemens 6ES7…"). */
const BRAND_BONUS = 3;
/** Une référence ou une recherche textuelle utile tient largement dans 200 caractères. */
const MAX_QUERY_LENGTH = 200;
const BRAND_CACHE_TTL_MS = 5 * 60_000;

let brandCache: { loadedAt: number; bySlug: Map<string, BrandRef> } | null = null;

/** Fabricants indexés par slug, gardés en mémoire quelques minutes (table petite, lue à chaque recherche). */
async function getBrandsBySlug(): Promise<Map<string, BrandRef>> {
  if (brandCache && Date.now() - brandCache.loadedAt < BRAND_CACHE_TTL_MS) {
    return brandCache.bySlug;
  }
  const rows = await db
    .select({ id: schema.manufacturers.id, slug: schema.manufacturers.slug, name: schema.manufacturers.name })
    .from(schema.manufacturers);
  brandCache = { loadedAt: Date.now(), bySlug: new Map(rows.map((r) => [r.slug, r])) };
  return brandCache.bySlug;
}

/**
 * Score de correspondance d'une référence avec un terme normalisé :
 * préfixe > sous-chaîne > similarité trigramme (pg_trgm). La proportion du
 * terme dans la référence départage les candidats d'une même catégorie.
 */
function refScore(column: SQL): SQL {
  return sql`CASE
    WHEN starts_with(${column}, t.term) THEN 0.6 + 0.3 * length(t.term)::float8 / length(${column})
    WHEN strpos(${column}, t.term) > 0 THEN 0.45 + 0.2 * length(t.term)::float8 / length(${column})
    ELSE similarity(${column}, t.term)::float8
  END`;
}

/**
 * Recherche sur PostgreSQL, en deux temps :
 *
 * 1. Génération de candidats, chaque stratégie étant servie par un index —
 *    jamais de scan complet de la table :
 *    - référence exacte (btree) sur les pièces et les cross-références ;
 *    - sous-chaîne / préfixe / similarité (GIN pg_trgm) ;
 *    - plein texte sur nom + description (GIN sur l'expression searchDocument).
 * 2. Classement : un match de référence (×10) domine toujours un match
 *    textuel ; le fabricant nommé dans la requête apporte un bonus. Le tri
 *    se termine par l'id pour une pagination stable.
 */
export class PostgresSearchService implements SearchService {
  async search(query: string, options: SearchOptions = {}): Promise<SearchHit[]> {
    const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH);
    if (!trimmed) return [];

    const limit = clamp(options.limit ?? 20, 1, SEARCH_MAX_LIMIT);
    const offset = clamp(options.offset ?? 0, 0, SEARCH_MAX_OFFSET);
    const parsed = parseSearchQuery(trimmed, await getBrandsBySlug());

    const filters: SQL[] = [];
    if (options.industry) filters.push(sql`m.industry::text = ${options.industry}`);
    if (options.status) filters.push(sql`p.status::text = ${options.status}`);
    if (options.manufacturerSlug) filters.push(sql`m.slug = ${options.manufacturerSlug}`);
    if (options.categorySlug) {
      filters.push(sql`p.category_id = (SELECT id FROM categories WHERE slug = ${options.categorySlug})`);
    }
    if (options.inStock) {
      filters.push(sql`EXISTS (SELECT 1 FROM offers o WHERE o.part_id = p.id AND o.price IS NOT NULL)`);
    }
    const extraWhere = filters.length > 0 ? sql` AND ${sql.join(filters, sql` AND `)}` : sql``;

    const minPrice = sql`(SELECT MIN(o.price) FROM offers o WHERE o.part_id = p.id)`;
    const orderBy = (relevance: SQL): SQL => {
      switch (options.sortBy) {
        case "price_asc":
          return sql`${minPrice} ASC NULLS LAST, ${relevance}, p.id`;
        case "price_desc":
          return sql`${minPrice} DESC NULLS LAST, ${relevance}, p.id`;
        case "name_asc":
          return sql`p.name ASC, p.id`;
        default:
          return sql`${relevance}, p.id`;
      }
    };

    const columns = sql`p.id AS part_id, p.name, p.reference_raw, p.slug, p.status, p.updated_at,
      m.name AS manufacturer_name, m.slug AS manufacturer_slug, m.industry`;

    let rows: unknown;
    if (parsed.brand && !parsed.text) {
      // Requête réduite à un nom de fabricant : toutes ses pièces.
      rows = await db.execute(sql`
        SELECT ${columns}, 1.0::float8 AS score
        FROM parts p
        JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE p.manufacturer_id = ${parsed.brand.id}${extraWhere}
        ORDER BY ${orderBy(sql`p.reference_normalized`)}
        LIMIT ${limit} OFFSET ${offset}
      `);
    } else {
      const termValues = parsed.refTerms.length > 0
        ? sql`ARRAY[${sql.join(parsed.refTerms.map((t) => sql`${t.term}`), sql`, `)}]::text[]`
        : sql`ARRAY[]::text[]`;
      const termWeights = parsed.refTerms.length > 0
        ? sql`ARRAY[${sql.join(parsed.refTerms.map((t) => sql`${t.weight}`), sql`, `)}]::float8[]`
        : sql`ARRAY[]::float8[]`;
      // Sans lettre ni chiffre, websearch_to_tsquery ne produit aucun lexème
      // (et Postgres émet un NOTICE à chaque appel) : branche inutile.
      const document = searchDocument(sql`p.name`, sql`p.description`);
      const textHits = /[\p{L}\p{N}]/u.test(parsed.text)
        ? sql`
          UNION ALL
          SELECT p.id, 0::float8, ts_rank(${document}, q.query)::float8
          FROM websearch_to_tsquery('french', ${parsed.text}) AS q(query)
          JOIN parts p ON ${document} @@ q.query`
        : sql``;
      const brandBonus = parsed.brand
        ? sql`CASE WHEN p.manufacturer_id = ${parsed.brand.id} THEN ${BRAND_BONUS} ELSE 0 END`
        : sql`0`;

      rows = await db.execute(sql`
        WITH terms(term, weight) AS (SELECT * FROM unnest(${termValues}, ${termWeights})),
        hits(id, ref_score, text_score) AS (
          SELECT p.id, t.weight, 0::float8
          FROM terms t JOIN parts p ON p.reference_normalized = t.term
          UNION ALL
          SELECT pr.part_id, 0.95 * t.weight, 0::float8
          FROM terms t JOIN part_references pr ON pr.reference_normalized = t.term
          UNION ALL
          SELECT p.id, t.weight * ${refScore(sql`p.reference_normalized`)}, 0::float8
          FROM terms t JOIN parts p
            ON length(t.term) >= 3
           AND (p.reference_normalized LIKE '%' || t.term || '%' OR p.reference_normalized % t.term)
          UNION ALL
          SELECT pr.part_id, 0.9 * t.weight * ${refScore(sql`pr.reference_normalized`)}, 0::float8
          FROM terms t JOIN part_references pr
            ON length(t.term) >= 3
           AND (pr.reference_normalized LIKE '%' || t.term || '%' OR pr.reference_normalized % t.term)
          ${textHits}
        ),
        scored AS (
          SELECT id, max(ref_score) AS ref_score, max(text_score) AS text_score
          FROM hits
          GROUP BY id
        )
        SELECT ${columns},
               (sc.ref_score * 10 + sc.text_score + ${brandBonus})::float8 AS score
        FROM scored sc
        JOIN parts p ON p.id = sc.id
        JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE (sc.ref_score > 0.3 OR sc.text_score > 0.01)${extraWhere}
        ORDER BY ${orderBy(sql`score DESC`)}
        LIMIT ${limit} OFFSET ${offset}
      `);
    }

    return (rows as SearchRow[]).map((r) => ({
      partId: Number(r.part_id),
      name: r.name,
      referenceRaw: r.reference_raw,
      slug: r.slug,
      status: r.status as SearchHit["status"],
      manufacturerName: r.manufacturer_name,
      manufacturerSlug: r.manufacturer_slug,
      industry: r.industry,
      score: Number(r.score),
      updatedAt: r.updated_at ? new Date(r.updated_at) : undefined,
    }));
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

export const searchService: SearchService = new PostgresSearchService();
