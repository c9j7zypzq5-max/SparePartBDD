/**
 * Charge le catalogue étendu directement en base via le pipeline d'ingestion
 * (mêmes règles que POST /api/ingest), lot par lot, dans l'ordre produit par
 * `npm run catalog:build`.
 *
 * Usage : DATABASE_URL=… npm run catalog:load
 *
 * Idempotent : relancé, il met à jour les fiches du catalogue étendu sans
 * créer de doublon. Les pièces du catalogue de démonstration n'y figurent pas
 * et ne sont donc pas modifiées.
 */
import fs from "node:fs";
import path from "node:path";
import type { IngestPayload } from "../../src/lib/ingest-types";
import { EDITION } from "./build";

async function main() {
  const dir = path.resolve(__dirname, "../../data/catalogue", EDITION);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^lot-\d+\.json$/.test(f)).sort() : [];
  if (files.length === 0) {
    console.error(`Aucun lot dans ${dir} : lancer d'abord npm run catalog:build`);
    process.exit(1);
  }

  // Import différé : src/db exige DATABASE_URL dès son chargement
  const { ingestParts } = await import("../../src/lib/ingest-pipeline");
  const { closeDb } = await import("../../src/db");

  const totals = { inserted: 0, updated: 0, errors: 0, warnings: 0 };
  try {
    for (const file of files) {
      const payload = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")) as IngestPayload;
      const result = await ingestParts(payload.parts, payload.source);
      totals.inserted += result.partsInserted;
      totals.updated += result.partsUpdated;
      totals.errors += result.errors.length;
      totals.warnings += result.warnings.length;
      console.log(`${file} : ${result.partsInserted} insérées, ${result.partsUpdated} mises à jour`);
      for (const error of result.errors) console.error(`  ERREUR ${error}`);
      for (const warning of result.warnings) console.warn(`  avertissement ${warning}`);
    }
  } finally {
    await closeDb();
  }
  console.log(
    `\nTotal : ${totals.inserted} insérées, ${totals.updated} mises à jour, ${totals.errors} erreur(s), ${totals.warnings} avertissement(s)`,
  );
  if (totals.errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
