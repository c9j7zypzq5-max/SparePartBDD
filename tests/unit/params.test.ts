import { test } from "node:test";
import assert from "node:assert/strict";
import { enumParam, intParam } from "@/lib/params";

const bounds = { fallback: 20, min: 1, max: 50 };

test("intParam : valeur valide, bornée, ou repli", () => {
  assert.equal(intParam("10", bounds), 10);
  assert.equal(intParam("500", bounds), 50);
  assert.equal(intParam("-5", bounds), 1);
  assert.equal(intParam("abc", bounds), 20);
  assert.equal(intParam("", bounds), 20);
  assert.equal(intParam(null, bounds), 20);
});

test("enumParam : seulement les valeurs autorisées", () => {
  assert.equal(enumParam("price_asc", ["relevance", "price_asc"] as const), "price_asc");
  assert.equal(enumParam("DROP TABLE", ["relevance", "price_asc"] as const), undefined);
  assert.equal(enumParam(null, ["relevance"] as const), undefined);
});
