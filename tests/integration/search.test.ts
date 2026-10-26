import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { closeDb } from "@/db";
import { ingestParts } from "@/lib/ingest-pipeline";
import { searchService } from "@/lib/search/postgres-search";
import type { IngestPart } from "@/lib/ingest-types";
import { resetDb } from "./helpers";

const parts: IngestPart[] = [
  { manufacturer: "Siemens", industry: "industrie", reference: "6ES7214-1AG40-0XB0", name: "CPU S7-1200 1214C", description: "Automate programmable compact", status: "active" },
  { manufacturer: "Siemens", industry: "industrie", reference: "6ES7214-1AG31-0XB0", name: "CPU S7-1200 1214C gen 3", status: "obsolete", supersededBy: "6ES7214-1AG40-0XB0" },
  { manufacturer: "Siemens", industry: "industrie", reference: "6SE6440-2UD21-5AA1", name: "Variateur MICROMASTER 440", status: "obsolete" },
  { manufacturer: "Cisco", industry: "informatique", reference: "PWR-C1-715WAC", name: "Alimentation 715 W AC Catalyst 9300", status: "active",
    crossReferences: [{ reference: "341-100733-01", type: "oem" }] },
  { manufacturer: "Cisco", industry: "informatique", reference: "GLC-SX-MMD", name: "Module optique SFP 1000BASE-SX", status: "active" },
  { manufacturer: "Schneider Electric", industry: "industrie", reference: "ATV320U15N4B", name: "Variateur Altivar 320 1,5 kW", status: "active" },
];

const refs = (hits: { referenceRaw: string }[]) => hits.map((h) => h.referenceRaw);

before(async () => {
  await resetDb();
  const result = await ingestParts(parts, "test");
  assert.deepEqual(result.errors, []);
});
after(closeDb);

test("référence exacte, quelle que soit la ponctuation", async () => {
  for (const q of ["6ES7214-1AG40-0XB0", "6es72141ag400xb0", "6ES7 214-1AG40-0XB0"]) {
    const hits = await searchService.search(q);
    assert.equal(hits[0]?.referenceRaw, "6ES7214-1AG40-0XB0", q);
  }
});

test("marque + référence : correspondance exacte en tête, bonus de marque", async () => {
  const hits = await searchService.search("Siemens 6ES7214-1AG40-0XB0");
  assert.equal(hits[0].referenceRaw, "6ES7214-1AG40-0XB0");
  assert.ok(hits[0].score > 10);
});

test("préfixe de référence (autocomplétion)", async () => {
  assert.deepEqual(
    refs(await searchService.search("6ES7214")).sort(),
    ["6ES7214-1AG31-0XB0", "6ES7214-1AG40-0XB0"],
  );
});

test("cross-référence", async () => {
  assert.equal((await searchService.search("341-100733-01"))[0]?.referenceRaw, "PWR-C1-715WAC");
});

test("faute de frappe dans la référence (similarité trigramme)", async () => {
  assert.equal((await searchService.search("PWR-C1-715WAX"))[0]?.referenceRaw, "PWR-C1-715WAC");
});

test("recherche textuelle sur le nom", async () => {
  assert.deepEqual(refs(await searchService.search("variateur")).sort(), ["6SE6440-2UD21-5AA1", "ATV320U15N4B"]);
});

test("marque seule : toutes ses pièces", async () => {
  assert.deepEqual(refs(await searchService.search("cisco")).sort(), ["GLC-SX-MMD", "PWR-C1-715WAC"]);
});

test("filtres statut et fabricant", async () => {
  assert.deepEqual(refs(await searchService.search("variateur", { status: "active" })), ["ATV320U15N4B"]);
  assert.deepEqual(refs(await searchService.search("variateur", { manufacturerSlug: "siemens" })), ["6SE6440-2UD21-5AA1"]);
});

test("pagination stable : pages disjointes", async () => {
  const page1 = refs(await searchService.search("siemens", { limit: 2, offset: 0 }));
  const page2 = refs(await searchService.search("siemens", { limit: 2, offset: 2 }));
  assert.equal(page1.length, 2);
  assert.equal(page2.length, 1);
  assert.equal(new Set([...page1, ...page2]).size, 3);
});

test("aucun résultat", async () => {
  assert.deepEqual(await searchService.search("zzzzzzzz"), []);
  assert.deepEqual(await searchService.search("   "), []);
});
