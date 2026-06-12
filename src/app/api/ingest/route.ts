import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { ingestParts } from "@/lib/ingest-pipeline";
import { referenceSlug, slugify } from "@/lib/normalize";
import type { IngestPayload } from "@/lib/ingest-types";

export const runtime = "nodejs";
// Les gros lots peuvent dépasser 60 s — augmenter la limite Vercel
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Authentification par clé API
  const apiKey = process.env.INGEST_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "INGEST_API_KEY non configurée côté serveur" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${apiKey}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  let payload: IngestPayload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!Array.isArray(payload.parts) || payload.parts.length === 0) {
    return Response.json({ error: "parts[] vide ou absent" }, { status: 400 });
  }
  if (!payload.source) {
    return Response.json({ error: "source manquante" }, { status: 400 });
  }

  const result = await ingestParts(payload.parts, payload.source);

  // Les pages pièces sont en ISR (1 h) : purge immédiate du cache des pièces
  // touchées pour que le site reflète l'ingestion sans attendre la revalidation.
  for (const p of payload.parts) {
    try {
      revalidatePath(`/piece/${slugify(p.manufacturer)}/${referenceSlug(p.reference)}`);
    } catch { /* revalidation best-effort */ }
  }

  return Response.json(result, {
    status: result.errors.length > 0 ? 207 : 200,
  });
}
