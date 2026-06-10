/**
 * Envoie un fichier JSON (IngestPayload) à l'API /api/ingest.
 *
 * Usage :
 *   tsx scripts/ingest/push.ts <fichier.json> [--url http://localhost:3000]
 *
 * Variables d'env nécessaires :
 *   INGEST_API_KEY — clé API (identique à celle du serveur)
 *   INGEST_URL     — URL de base (optionnel, remplace --url)
 */
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith("--"));
const urlFlagIdx = args.indexOf("--url");
const urlFlag = urlFlagIdx >= 0 ? args[urlFlagIdx + 1] : undefined;

if (!fileArg) {
  console.error("Usage : tsx scripts/ingest/push.ts <fichier.json> [--url http://...]");
  process.exit(1);
}

const apiKey = process.env.INGEST_API_KEY;
if (!apiKey) {
  console.error("Variable INGEST_API_KEY manquante");
  process.exit(1);
}

const baseUrl =
  urlFlag ??
  process.env.INGEST_URL ??
  "http://localhost:3000";

const filePath = path.resolve(fileArg);
let payload: unknown;
try {
  payload = JSON.parse(fs.readFileSync(filePath, "utf-8"));
} catch (err) {
  console.error(`Impossible de lire/parser ${filePath} :`, err);
  process.exit(1);
}

console.log(`Envoi de ${filePath} vers ${baseUrl}/api/ingest …`);

const res = await fetch(`${baseUrl}/api/ingest`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify(payload),
});

const body = await res.json();
if (res.ok || res.status === 207) {
  console.log(
    `✔ ${body.partsInserted} insérées, ${body.partsUpdated} mises à jour, ${body.offersInserted} offres`,
  );
  if (body.errors?.length) {
    console.warn(`⚠ ${body.errors.length} erreur(s) :`, body.errors);
  }
} else {
  console.error(`Erreur ${res.status} :`, body);
  process.exit(1);
}
