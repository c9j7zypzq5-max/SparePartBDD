import { NextRequest } from "next/server";
import postgres from "postgres";
import { catalogSql } from "@/db/catalog-sql";

export const runtime = "nodejs";
export const maxDuration = 300;

// Route d'amorçage TEMPORAIRE : exécute le catalogue complet (TRUNCATE +
// inserts) dans la base. Protégée par jeton à usage unique, à supprimer
// après utilisation.
const SEED_TOKEN = "540821343168665d93794ffe17c3290e26f516ae8801b5a4";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${SEED_TOKEN}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const sql = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  try {
    await sql.unsafe(catalogSql).simple();
    const [counts] = await sql`
      SELECT
        (SELECT count(*)::int FROM parts) AS parts,
        (SELECT count(*)::int FROM offers) AS offers,
        (SELECT count(*)::int FROM supersessions) AS supersessions,
        (SELECT count(*)::int FROM manufacturers) AS manufacturers
    `;
    return Response.json({ ok: true, counts });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  } finally {
    await sql.end();
  }
}
