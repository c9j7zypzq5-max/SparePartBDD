import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanRecord, offerProblem, validatePart } from "@/lib/ingest-validation";
import type { IngestOffer, IngestPart } from "@/lib/ingest-types";

const valid: IngestPart = {
  manufacturer: "Siemens",
  industry: "industrie",
  reference: "6ES7214-1AG40-0XB0",
  name: "CPU 1214C",
};

test("validatePart accepte une pièce complète", () => {
  assert.equal(validatePart(valid), null);
});

test("validatePart rejette les champs indispensables manquants ou invalides", () => {
  assert.match(validatePart({ ...valid, manufacturer: " " })!, /manufacturer/);
  assert.match(validatePart({ ...valid, reference: "--" })!, /reference/);
  assert.match(validatePart({ ...valid, name: "" })!, /name/);
  assert.match(validatePart({ ...valid, industry: "aero" as never })!, /industry/);
  assert.match(validatePart({ ...valid, status: "eol" as never })!, /status/);
});

test("offerProblem : vendeur, type, URL et prix", () => {
  const offer: IngestOffer = { sellerName: "Radwell", sellerType: "reconditionne", url: "https://radwell.com/p/1", price: 10 };
  assert.equal(offerProblem(offer), null);
  assert.match(offerProblem({ ...offer, url: "javascript:alert(1)" })!, /url/);
  assert.match(offerProblem({ ...offer, price: -1 })!, /prix/);
  assert.match(offerProblem({ ...offer, sellerType: "grossiste" as never })!, /sellerType/);
});

test("cleanRecord : un objet vide ou de valeurs vides ne compte pas", () => {
  assert.equal(cleanRecord({}), null);
  assert.equal(cleanRecord({ Tension: " " }), null);
  assert.deepEqual(cleanRecord({ " Tension ": " 24 V " }), { Tension: "24 V" });
  assert.equal(cleanRecord(["a"]), null);
});
