import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSearchQuery, type BrandRef } from "@/lib/search/query-parser";

const brands = new Map<string, BrandRef>(
  [
    { id: 1, slug: "siemens", name: "Siemens" },
    { id: 2, slug: "schneider-electric", name: "Schneider Electric" },
    { id: 3, slug: "cisco", name: "Cisco" },
  ].map((b) => [b.slug, b]),
);

test("marque + référence : la marque est extraite, la référence pèse 1", () => {
  const q = parseSearchQuery("Siemens 6ES7214-1AG40-0XB0", brands);
  assert.equal(q.brand?.slug, "siemens");
  assert.equal(q.text, "6ES7214-1AG40-0XB0");
  assert.deepEqual(q.refTerms, [{ term: "6ES72141AG400XB0", weight: 1 }]);
});

test("nom de marque en plusieurs mots, insensible à la casse", () => {
  const q = parseSearchQuery("schneider electric ATV320U15N4B", brands);
  assert.equal(q.brand?.slug, "schneider-electric");
  assert.deepEqual(q.refTerms, [{ term: "ATV320U15N4B", weight: 1 }]);
});

test("marque seule : aucun texte ni référence", () => {
  const q = parseSearchQuery("Cisco", brands);
  assert.equal(q.brand?.slug, "cisco");
  assert.equal(q.text, "");
  assert.deepEqual(q.refTerms, []);
});

test("référence saisie avec espaces : le texte entier forme la référence", () => {
  const q = parseSearchQuery("11 42 7 953 129", brands);
  assert.equal(q.brand, null);
  assert.deepEqual(q.refTerms, [{ term: "11427953129", weight: 1 }]);
});

test("fragments de référence pondérés par leur longueur", () => {
  const q = parseSearchQuery("6ES7 214-1AG40-0XB0", brands);
  assert.deepEqual(q.refTerms, [
    { term: "6ES72141AG400XB0", weight: 1 },
    { term: "2141AG400XB0", weight: 0.75 },
    { term: "6ES7", weight: 0.25 },
  ]);
});

test("référence au milieu d'une phrase", () => {
  const q = parseSearchQuery("remplacement 6ES7214-1AG31", brands);
  assert.ok(q.refTerms.some((t) => t.term === "6ES72141AG31" && t.weight === 1));
  assert.equal(q.text, "remplacement 6ES7214-1AG31");
});

test("langage naturel sans chiffre : pas de terme de référence", () => {
  const q = parseSearchQuery("alimentation serveur", brands);
  assert.deepEqual(q.refTerms, []);
  assert.equal(q.text, "alimentation serveur");
});

test("référence sans chiffre en un seul mot (ex. GLC-SX-MMD)", () => {
  const q = parseSearchQuery("GLC-SX-MMD", brands);
  assert.deepEqual(q.refTerms, [{ term: "GLCSXMMD", weight: 1 }]);
});
