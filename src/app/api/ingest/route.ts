import { NextRequest } from "next/server";
import { ingestParts } from "@/lib/ingest-pipeline";
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

  return Response.json(result, {
    status: result.errors.length > 0 ? 207 : 200,
  });
}
