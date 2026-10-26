import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { closeDb } from "@/db";
import { ingestParts } from "@/lib/ingest-pipeline";
import { applyLifecycleReport } from "@/lib/lifecycle-pipeline";
import { resetDb, rows } from "./helpers";

type Row = { id: number; status: string; needs_review: boolean; checked: boolean; note: string | null };
const state = () =>
  rows<Row>(sql`SELECT id, status, needs_review, lifecycle_checked_at IS NOT NULL AS checked, lifecycle_note AS note FROM parts ORDER BY id`);

before(async () => {
  await resetDb();
  await ingestParts(
    ["A-1", "B-2", "C-3", "D-4"].map((reference) => ({
      manufacturer: "ABB",
      industry: "industrie" as const,
      reference,
      name: `Pièce ${reference}`,
      status: "active" as const,
    })),
    "test",
  );
});
after(closeDb);

test("applique la politique de veille selon le verdict", async () => {
  const report = await applyLifecycleReport(
    [
      { partId: 1, outcome: "obsolete", evidence: "HTTP 404" },
      { partId: 2, outcome: "active" },
      { partId: 3, outcome: "ambiguous" },
      { partId: 4, outcome: "error", evidence: "timeout" },
      { partId: 999, outcome: "active" },
    ],
    "test",
  );
  assert.deepEqual(
    { updated: report.updated, flagged: report.flaggedForReview, errorsRecorded: report.errorsRecorded },
    { updated: 2, flagged: 1, errorsRecorded: 1 },
  );
  assert.deepEqual(report.errors, ["[part 999] pièce inconnue"]);

  const [p1, p2, p3, p4] = await state();
  assert.deepEqual([p1.status, p1.needs_review, p1.checked, p1.note], ["obsolete", false, true, "HTTP 404"]);
  assert.deepEqual([p2.status, p2.checked], ["active", true]);
  assert.deepEqual([p3.status, p3.needs_review, p3.checked], ["active", true, true]);
  // Erreur transitoire : rien ne change sauf la note, la pièce reste due
  assert.deepEqual([p4.status, p4.checked, p4.note], ["active", false, "erreur : timeout"]);
});
