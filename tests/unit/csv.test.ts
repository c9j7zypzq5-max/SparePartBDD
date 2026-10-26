import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, toCsv, UTF8_BOM } from "@/lib/csv";

test("csvCell échappe les guillemets", () => {
  assert.equal(csvCell('CPU "1214C"'), '"CPU ""1214C"""');
});

test("csvCell neutralise les formules (injection CSV)", () => {
  assert.equal(csvCell("=HYPERLINK(\"http://x\")"), '"\'=HYPERLINK(""http://x"")"');
  assert.equal(csvCell("+33 1 23"), "\"'+33 1 23\"");
  assert.equal(csvCell("@SUM(A1)"), "\"'@SUM(A1)\"");
});

test("csvCell : nombres bruts, vides pour null/undefined/NaN", () => {
  assert.equal(csvCell(-12.5), "-12.5");
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(undefined), "");
  assert.equal(csvCell(Number.NaN), "");
});

test("toCsv commence par le BOM UTF-8 (accents corrects dans Excel)", () => {
  const csv = toCsv([["Référence", "Prix"], ["6ES7", 12]]);
  assert.ok(csv.startsWith(UTF8_BOM));
  assert.equal(csv.slice(1), '"Référence","Prix"\n"6ES7",12');
});
