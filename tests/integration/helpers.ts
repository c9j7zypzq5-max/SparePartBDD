import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function resetDb(): Promise<void> {
  await db.execute(sql`
    TRUNCATE offers, compatibilities, supersessions, part_references, parts,
             sellers, categories, manufacturers, suggestions, watchlist_subscriptions
    RESTART IDENTITY CASCADE
  `);
}

/** Exécute une requête SQL brute et renvoie ses lignes (tableau simple, comparable par deepEqual). */
export async function rows<T>(query: ReturnType<typeof sql>): Promise<T[]> {
  return [...((await db.execute(query)) as unknown as T[])];
}
