import { NextRequest } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";
export const maxDuration = 60;

// Route de migration TEMPORAIRE : ajoute les colonnes de suivi du cycle de
// vie sur la table parts. Protégée par jeton à usage unique, à supprimer
// après exécution.
const MIGRATE_TOKEN = "cce8ed392ab69b1318fb15d9577c07925400f6e6be06f490";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (token !== MIGRATE_TOKEN) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const sql = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  try {
    await sql.unsafe(`
      ALTER TABLE parts ADD COLUMN IF NOT EXISTS product_url text;
      ALTER TABLE parts ADD COLUMN IF NOT EXISTS lifecycle_checked_at timestamp;
      ALTER TABLE parts ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;
      ALTER TABLE parts ADD COLUMN IF NOT EXISTS lifecycle_note text;
    `).simple();
    const cols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'parts' AND column_name IN
        ('product_url', 'lifecycle_checked_at', 'needs_review', 'lifecycle_note')
      ORDER BY column_name
    `;
    return Response.json({ ok: true, columns: cols.map((c) => c.column_name) });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  } finally {
    await sql.end();
  }
}
