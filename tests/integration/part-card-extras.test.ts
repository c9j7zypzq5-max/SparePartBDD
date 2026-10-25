import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { closeDb } from "@/db";
import { ingestParts } from "@/lib/ingest-pipeline";
import { getPartCardExtras } from "@/lib/queries";
import type { IngestPart } from "@/lib/ingest-types";
import { resetDb, rows } from "./helpers";

const offer = (sellerName: string, price?: number) => ({
  sellerName,
  sellerType: "distributeur_officiel" as const,
  price,
  url: `https://example.com/${sellerName}`,
});

// Chaîne A (obsolète) → B (obsolète) → C (fabriquée) ; D obsolète remplacée par E obsolète.
const parts: IngestPart[] = [
  { manufacturer: "Siemens", industry: "industrie", reference: "A-100", name: "Pièce A", status: "obsolete", supersededBy: "B-200",
    offers: [offer("Radwell", 420), offer("EU Automation", 310), offer("Surplus", undefined)] },
  { manufacturer: "Siemens", industry: "industrie", reference: "B-200", name: "Pièce B", status: "obsolete", supersededBy: "C-300" },
  { manufacturer: "Siemens", industry: "industrie", reference: "C-300", name: "Pièce C", status: "active", offers: [offer("Radwell", 99)] },
  { manufacturer: "Siemens", industry: "industrie", reference: "D-400", name: "Pièce D", status: "obsolete", supersededBy: "E-500",
    offers: [offer("Surplus", undefined)] },
  { manufacturer: "Siemens", industry: "industrie", reference: "E-500", name: "Pièce E", status: "obsolete" },
];

let ids: Record<string, number> = {};

before(async () => {
  await resetDb();
  const result = await ingestParts(parts, "test");
  assert.deepEqual(result.errors, []);
  const found = await rows<{ id: number; reference_raw: string }>(sql`SELECT id, reference_raw FROM parts`);
  ids = Object.fromEntries(found.map((r) => [r.reference_raw, Number(r.id)]));
});
after(closeDb);

test("meilleur prix et nombre d'offres (offres sans prix comprises)", async () => {
  const extras = await getPartCardExtras([{ id: ids["A-100"], status: "obsolete" }]);
  const a = extras.get(ids["A-100"]);
  assert.equal(a?.minPrice, 310);
  assert.equal(a?.currency, "EUR");
  assert.equal(a?.offerCount, 3);
});

test("pièce sans offre chiffrée ni offre du tout", async () => {
  const extras = await getPartCardExtras([
    { id: ids["D-400"], status: "obsolete" },
    { id: ids["E-500"], status: "obsolete" },
  ]);
  assert.deepEqual(
    { minPrice: extras.get(ids["D-400"])?.minPrice, offerCount: extras.get(ids["D-400"])?.offerCount },
    { minPrice: null, offerCount: 1 },
  );
  assert.deepEqual(extras.get(ids["E-500"]), { minPrice: null, currency: "EUR", offerCount: 0, replacement: null });
});

test("remplacement proposé : premier successeur encore fabriqué de la chaîne", async () => {
  const extras = await getPartCardExtras([{ id: ids["A-100"], status: "obsolete" }]);
  assert.equal(extras.get(ids["A-100"])?.replacement?.referenceRaw, "C-300");
  assert.equal(extras.get(ids["A-100"])?.replacement?.status, "active");
});

test("sans successeur fabriqué : le remplacement direct, même obsolète", async () => {
  const extras = await getPartCardExtras([{ id: ids["D-400"], status: "obsolete" }]);
  assert.equal(extras.get(ids["D-400"])?.replacement?.referenceRaw, "E-500");
});

test("pas de remplacement calculé pour une pièce fabriquée", async () => {
  const extras = await getPartCardExtras([{ id: ids["C-300"], status: "active" }]);
  assert.equal(extras.get(ids["C-300"])?.replacement, null);
  assert.equal(extras.get(ids["C-300"])?.minPrice, 99);
});

test("liste vide : aucune requête, résultat vide", async () => {
  assert.equal((await getPartCardExtras([])).size, 0);
});
