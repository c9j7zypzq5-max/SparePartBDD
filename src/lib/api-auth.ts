import { timingSafeEqual } from "node:crypto";

/**
 * Authentification des routes machine-à-machine (Mac mini → Vercel) par
 * `Authorization: Bearer $INGEST_API_KEY`.
 *
 * Renvoie une Response d'erreur à retourner telle quelle, ou null si la
 * requête est autorisée. La comparaison se fait à temps constant pour ne pas
 * laisser deviner la clé caractère par caractère.
 */
export function requireApiKey(req: { headers: Headers }): Response | null {
  const apiKey = process.env.INGEST_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "INGEST_API_KEY non configurée côté serveur" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${apiKey}`)) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }
  return null;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
