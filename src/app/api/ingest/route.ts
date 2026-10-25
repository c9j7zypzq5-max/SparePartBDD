import { NextRequest } from "next/server";
import { ingestParts } from "@/lib/ingest-pipeline";
import type { IngestPayload } from "@/lib/ingest-types";
import { requireApiKey } from "@/lib/api-auth";

export const runtime = "nodejs";
// Les gros lots peuvent dépasser 60 s — augmenter la limite Vercel
export const maxDuration = 300;

/** Au-delà, le lot risque de dépasser maxDuration : découper côté client. */
const MAX_PARTS_PER_BATCH = 500;

export async function POST(req: NextRequest) {
  // Authentification par clé API
  const authError = requireApiKey(req);
  if (authError) return authError;

  let payload: IngestPayload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!payload || !Array.isArray(payload.parts) || payload.parts.length === 0) {
    return Response.json({ error: "parts[] vide ou absent" }, { status: 400 });
  }
  if (payload.parts.length > MAX_PARTS_PER_BATCH) {
    return Response.json(
      { error: `Lot trop gros (${payload.parts.length} pièces, max ${MAX_PARTS_PER_BATCH})` },
      { status: 413 },
    );
  }
  if (typeof payload.source !== "string" || !payload.source.trim()) {
    return Response.json({ error: "source manquante" }, { status: 400 });
  }

  const result = await ingestParts(payload.parts, payload.source);

  return Response.json(result, {
    status: result.errors.length > 0 ? 207 : 200,
  });
}
