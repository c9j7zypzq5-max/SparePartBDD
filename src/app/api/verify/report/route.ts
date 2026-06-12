import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const runtime = "nodejs";

type VerifyOutcome = "ok" | "dead" | "redirect" | "error";

interface VerifyResultItem {
  partId: number;
  outcome: VerifyOutcome;
  /** URL finale après redirection (optionnel — pour mettre à jour la productUrl) */
  newUrl?: string;
  note?: string;
}

/**
 * POST /api/verify/report — enregistre les résultats de vérification d'URLs.
 *
 * - "dead"     : efface productUrl, lève needsReview, met à jour urlVerifiedAt
 * - "ok"       : met à jour urlVerifiedAt
 * - "redirect" : met à jour urlVerifiedAt + productUrl si newUrl fourni
 * - "error"    : rien (timeout réseau — réessayer plus tard)
 *
 * Auth : Bearer INGEST_API_KEY
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.INGEST_API_KEY;
  if (!apiKey) return Response.json({ error: "INGEST_API_KEY non configurée" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${apiKey}`)
    return Response.json({ error: "Non autorisé" }, { status: 401 });

  let body: { results: VerifyResultItem[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!Array.isArray(body?.results) || body.results.length === 0)
    return Response.json({ error: "results[] vide ou absent" }, { status: 400 });

  const now = new Date();
  let cleared = 0;
  let verified = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const r of body.results) {
    if (!r.partId || typeof r.partId !== "number") { errors.push(`partId invalide: ${r.partId}`); continue; }

    try {
      if (r.outcome === "dead") {
        await db
          .update(schema.parts)
          .set({
            productUrl: null,
            needsReview: true,
            urlVerifiedAt: now,
            lifecycleNote: `URL morte détectée par verify-links${r.note ? ` (${r.note})` : ""}`,
            updatedAt: now,
          })
          .where(eq(schema.parts.id, r.partId));
        cleared++;
      } else if (r.outcome === "ok") {
        await db
          .update(schema.parts)
          .set({ urlVerifiedAt: now, updatedAt: now })
          .where(eq(schema.parts.id, r.partId));
        verified++;
      } else if (r.outcome === "redirect" && r.newUrl) {
        await db
          .update(schema.parts)
          .set({ productUrl: r.newUrl, urlVerifiedAt: now, updatedAt: now })
          .where(eq(schema.parts.id, r.partId));
        verified++;
      } else {
        // "error" or "redirect" without newUrl — don't touch urlVerifiedAt
        skipped++;
      }
    } catch (err) {
      errors.push(`[partId ${r.partId}] ${String(err)}`);
    }
  }

  return Response.json(
    { cleared, verified, skipped, errors },
    { status: errors.length > 0 ? 207 : 200 },
  );
}
