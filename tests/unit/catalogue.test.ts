import { test } from "node:test";
import assert from "node:assert/strict";
import type { IngestPart } from "@/lib/ingest-types";
import { buildSql, check, loadOrder, readExistingCatalog, type ExistingCatalog } from "../../scripts/catalog/build";
import { CATALOGUE } from "../../scripts/catalog/data";

const existing = readExistingCatalog();

function part(reference: string, extra: Partial<IngestPart> = {}): IngestPart {
  return {
    manufacturer: "Siemens",
    industry: "industrie",
    reference,
    name: `Pièce ${reference}`,
    category: "Automates programmables",
    status: "active",
    confidenceScore: 80,
    ...extra,
  };
}

test("le catalogue étendu passe tous les contrôles", () => {
  const { parts, report } = check(CATALOGUE, existing);
  assert.deepEqual(report.errors, []);
  assert.equal(parts.length, CATALOGUE.length - report.skippedExisting.length);
  assert.ok(parts.every((p) => !p.offers?.length && !p.productUrl), "ni offre ni URL produit non vérifiée");
});

test("check : doublon de référence normalisée", () => {
  const { report } = check([part("6ES7 999-0AA00"), part("6ES7999-0AA00")], existing);
  assert.equal(report.errors.length, 1);
  assert.match(report.errors[0], /doublon/);
});

test("check : remplacement absent, auto-remplacement, pièce active remplacée", () => {
  const { report } = check(
    [
      part("TEST-A", { status: "obsolete", supersededBy: "TEST-INCONNUE" }),
      part("TEST-B", { status: "obsolete", supersededBy: "TEST-B" }),
      part("TEST-C", { supersededBy: "TEST-A" }),
    ],
    existing,
  );
  assert.ok(report.errors.some((e) => e.includes("TEST-A") && e.includes("absent du catalogue")));
  assert.ok(report.errors.some((e) => e.includes("TEST-B") && e.includes("se remplace elle-même")));
  assert.ok(report.errors.some((e) => e.includes("TEST-C") && e.includes("active mais remplacée")));
});

test("check : cycle de remplacement", () => {
  const { report } = check(
    [part("TEST-A", { status: "obsolete", supersededBy: "TEST-B" }), part("TEST-B", { status: "obsolete", supersededBy: "TEST-A" })],
    existing,
  );
  assert.ok(report.errors.some((e) => e.includes("cycle")));
});

test("check : une pièce déjà en base est écartée, un remplacement vers elle est accepté", () => {
  const { parts, report } = check(
    [part("6ES7214-1AG40-0XB0"), part("TEST-1214-OLD", { status: "obsolete", supersededBy: "6ES7214-1AG40-0XB0" })],
    existing,
  );
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.skippedExisting, ["Siemens 6ES7214-1AG40-0XB0"]);
  assert.deepEqual(parts.map((p) => p.reference), ["TEST-1214-OLD"]);
});

test("check : cross-référence déjà portée par une autre pièce", () => {
  const { report } = check([part("TEST-X", { crossReferences: [{ reference: "ATV320U15N4W", type: "oem" }] })], {
    ...existing,
    crossRefs: new Map([["ATV320U15N4W", "schneider-electric|ATV320U15N4B"]]),
  } satisfies ExistingCatalog);
  assert.ok(report.errors.some((e) => e.includes("ATV320U15N4W")));
});

test("loadOrder : un remplacement passe avant la pièce qu'il remplace", () => {
  const ordered = loadOrder([
    part("TEST-OLD", { status: "obsolete", supersededBy: "TEST-MID" }),
    part("TEST-MID", { status: "obsolete", supersededBy: "TEST-NEW" }),
    part("TEST-NEW"),
  ]);
  assert.deepEqual(ordered.map((p) => p.reference), ["TEST-NEW", "TEST-MID", "TEST-OLD"]);
});

test("buildSql : script additif et idempotent", () => {
  const sql = buildSql([part("TEST-NEW"), part("TEST-OLD", { status: "obsolete", supersededBy: "TEST-NEW" })], existing);
  assert.match(sql, /^BEGIN;$/m);
  assert.match(sql, /^COMMIT;$/m);
  assert.doesNotMatch(sql, /\b(TRUNCATE|DELETE|UPDATE|DROP)\b/i);
  const inserts = sql.match(/^INSERT INTO /gm)?.length ?? 0;
  const guarded = sql.match(/ON CONFLICT .* DO NOTHING;$/gm)?.length ?? 0;
  assert.ok(inserts > 0);
  assert.equal(guarded, inserts, "chaque INSERT est protégé par ON CONFLICT DO NOTHING");
});
