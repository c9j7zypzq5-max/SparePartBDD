import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Document plein texte d'une pièce : nom (poids A) + description (poids B).
 *
 * Indexé en GIN par une expression (schema.ts) plutôt que stocké dans une
 * colonne générée : aucune colonne nouvelle, donc le code fonctionne aussi
 * sur une base pas encore migrée (l'index ne fait qu'accélérer). La
 * recherche (postgres-search.ts) doit utiliser exactement cette expression
 * pour que Postgres reconnaisse l'index.
 */
export function searchDocument(name: SQL | AnyPgColumn, description: SQL | AnyPgColumn): SQL {
  return sql`(setweight(to_tsvector('french', coalesce(${name}, '')), 'A') || setweight(to_tsvector('french', coalesce(${description}, '')), 'B'))`;
}
