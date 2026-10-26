import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { closeDb } from "@/db";
import { ingestParts } from "@/lib/ingest-pipeline";
import type { IngestPart } from "@/lib/ingest-types";
import { resetDb, rows } from "./helpers";

const cpu: IngestPart = {
  manufacturer: "Siemens",
  industry: "industrie",
  reference: "6ES7214-1AG40-0XB0",
  name: "CPU S7-1200 1214C",
  description: "Automate SIMATIC S7-1200",
  status: "active",
  category: "Automates programmables",
  attributes: { Alimentation: "24 V DC" },
  crossReferences: [{ reference: "6ES7 214-1AG40-0XB0", type: "oem" }],
  offers: [
    { sellerName: "Radwell", sellerType: "reconditionne", price: 420, url: "https://www.radwell.com/p/1" },
  ],
};

type PartRow = {
  name: string;
  status: string;
  description: string | null;
  category_id: number | null;
  attributes: Record<string, string> | null;
  specs: Record<string, string> | null;
};

async function part(refNorm: string): Promise<PartRow> {
  const [row] = await rows<PartRow>(
    sql`SELECT name, status, description, category_id, attributes, specs FROM parts WHERE reference_normalized = ${refNorm}`,
  );
  return row;
}

beforeEach(resetDb);
after(closeDb);

test("insère pièce, catégorie, cross-référence et offre", async () => {
  const result = await ingestParts([cpu], "test");
  assert.deepEqual(result, { partsInserted: 1, partsUpdated: 0, offersInserted: 1, errors: [], warnings: [] });
  const [counts] = await rows<{ xrefs: number; offers: number; cats: number }>(sql`
    SELECT (SELECT count(*)::int FROM part_references) AS xrefs,
           (SELECT count(*)::int FROM offers) AS offers,
           (SELECT count(*)::int FROM categories) AS cats`);
  assert.deepEqual(counts, { xrefs: 1, offers: 1, cats: 1 });
});

test("une mise à jour partielle n'efface aucune donnée existante", async () => {
  await ingestParts([{ ...cpu, specs: { Protocole: "PROFINET" } }], "test");
  // Lot typique du mode --update : ni description, ni catégorie, attributs vides, statut inconnu
  const result = await ingestParts(
    [{ manufacturer: "Siemens", industry: "industrie", reference: "6ES7214-1AG40-0XB0", name: "CPU 1214C (maj)", status: "unknown", attributes: {}, specs: {} }],
    "test",
  );
  assert.deepEqual(result.errors, []);
  assert.equal(result.partsUpdated, 1);
  const row = await part("6ES72141AG400XB0");
  assert.equal(row.name, "CPU 1214C (maj)");
  assert.equal(row.status, "active");
  assert.equal(row.description, "Automate SIMATIC S7-1200");
  assert.notEqual(row.category_id, null);
  assert.deepEqual(row.attributes, { Alimentation: "24 V DC" });
  assert.deepEqual(row.specs, { Protocole: "PROFINET" });
});

test("le statut prouvé par la veille n'est pas contredit par un lot", async () => {
  await ingestParts([cpu], "test");
  await rows(sql`UPDATE parts SET status = 'obsolete', lifecycle_checked_at = now(), needs_review = false`);
  await ingestParts([{ ...cpu, status: "active" }], "test");
  assert.equal((await part("6ES72141AG400XB0")).status, "obsolete");

  // Signal ambigu : la veille n'a rien prouvé, le lot peut trancher
  await rows(sql`UPDATE parts SET needs_review = true`);
  await ingestParts([{ ...cpu, status: "active" }], "test");
  assert.equal((await part("6ES72141AG400XB0")).status, "active");
});

test("fabricant : une variante d'écriture ne renomme pas la marque", async () => {
  await ingestParts([cpu], "test");
  await ingestParts([{ ...cpu, manufacturer: "SIEMENS", industry: "electronique" }], "test");
  const brands = await rows<{ name: string; industry: string }>(sql`SELECT name, industry FROM manufacturers`);
  assert.deepEqual(brands, [{ name: "Siemens", industry: "industrie" }]);
});

test("supersession résolue vers une pièce d'un lot précédent", async () => {
  await ingestParts([cpu], "lot-1");
  const result = await ingestParts(
    [{ ...cpu, reference: "6ES7214-1AG31-0XB0", status: "obsolete", supersededBy: "6ES7214-1AG40-0XB0", offers: [] }],
    "lot-2",
  );
  assert.deepEqual(result.warnings, []);
  const [{ n }] = await rows<{ n: number }>(sql`SELECT count(*)::int AS n FROM supersessions`);
  assert.equal(n, 1);
});

test("relations vers des pièces absentes : avertissements, pas d'erreur", async () => {
  const result = await ingestParts(
    [{ ...cpu, supersededBy: "INCONNUE-1", compatibleWith: ["ABB|INCONNUE-2", "sans-separateur"] }],
    "test",
  );
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 3);
});

test("offres : sans prix, le dernier prix est conservé ; doublon vendeur dédoublonné", async () => {
  await ingestParts([cpu], "test");
  const result = await ingestParts(
    [{
      ...cpu,
      offers: [
        { sellerName: "Radwell", sellerType: "reconditionne", url: "https://www.radwell.com/recherche" },
        { sellerName: "Radwell", sellerType: "reconditionne", url: "https://www.radwell.com/p/2" },
      ],
    }],
    "test",
  );
  assert.deepEqual(result.errors, []);
  const offers = await rows<{ price: string; url: string }>(sql`SELECT price, url FROM offers`);
  assert.deepEqual(offers, [{ price: "420.00", url: "https://www.radwell.com/p/2" }]);
});

test("une pièce invalide n'empêche pas le reste du lot", async () => {
  const result = await ingestParts(
    [{ ...cpu, industry: "aeronautique" as never }, { ...cpu, reference: "6ES7215-1AG40-0XB0" }],
    "test",
  );
  assert.equal(result.partsInserted, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /industry invalide/);
});
