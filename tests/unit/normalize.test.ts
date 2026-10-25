import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeReference, referenceSlug, slugify } from "@/lib/normalize";

test("normalizeReference : majuscules, alphanumérique seul", () => {
  assert.equal(normalizeReference("11 42 7 953 129"), "11427953129");
  assert.equal(normalizeReference("11-42-7953129"), "11427953129");
  assert.equal(normalizeReference("6es7214-1ag40-0xb0"), "6ES72141AG400XB0");
  assert.equal(normalizeReference(""), "");
});

test("referenceSlug : référence normalisée en minuscules", () => {
  assert.equal(referenceSlug("PWR-C1-715WAC"), "pwrc1715wac");
});

test("slugify : sans accents ni ponctuation", () => {
  assert.equal(slugify("Schneider Electric"), "schneider-electric");
  assert.equal(slugify("Contrôleurs RAID"), "controleurs-raid");
  assert.equal(slugify("Batteries d'ordinateur portable"), "batteries-d-ordinateur-portable");
  assert.equal(slugify("  --  "), "");
});
