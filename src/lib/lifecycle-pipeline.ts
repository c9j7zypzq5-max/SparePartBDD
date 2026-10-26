import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type {
  LifecycleReportItem,
  LifecycleReportResult,
} from "@/lib/lifecycle-types";

/**
 * Applique un rapport de veille au catalogue. Le script Mac mini se contente
 * de classifier chaque page produit ; c'est ici, et uniquement ici, que la
 * politique de mise à jour est appliquée :
 *
 * - active    → status 'active', needsReview effacé
 * - obsolete  → status 'obsolete', needsReview effacé (signal sûr uniquement)
 * - ambiguous → statut inchangé, needsReview levé
 * - error     → rien ne change (pas même lifecycleCheckedAt, pour que la
 *               pièce soit automatiquement re-tentée au prochain run)
 *
 * Les erreurs par item sont collectées sans interrompre le reste du lot.
 */
export async function applyLifecycleReport(
  results: LifecycleReportItem[],
  source: string,
): Promise<LifecycleReportResult> {
  const report: LifecycleReportResult = {
    updated: 0,
    flaggedForReview: 0,
    errorsRecorded: 0,
    errors: [],
  };

  for (const item of results) {
    try {
      const checkedAt = item.checkedAt ? new Date(item.checkedAt) : new Date();
      if (Number.isNaN(checkedAt.getTime())) {
        report.errors.push(`[part ${item.partId}] checkedAt invalide`);
        continue;
      }
      if (!Number.isInteger(item.partId)) {
        report.errors.push(`[part ${item.partId}] partId invalide`);
        continue;
      }

      let changes: Partial<typeof schema.parts.$inferInsert>;
      switch (item.outcome) {
        case "active":
        case "obsolete":
          changes = {
            status: item.outcome,
            needsReview: false,
            lifecycleCheckedAt: checkedAt,
            lifecycleNote: item.evidence ?? `${source} : page produit active`,
          };
          break;
        case "ambiguous":
          changes = {
            needsReview: true,
            lifecycleCheckedAt: checkedAt,
            lifecycleNote: item.evidence ?? "aucun signal détecté",
          };
          break;
        case "error":
          // Erreur transitoire : on ne touche pas à lifecycleCheckedAt afin
          // que la pièce reste dans la file du prochain run.
          changes = { lifecycleNote: `erreur : ${item.evidence ?? "inconnue"}` };
          break;
        default:
          report.errors.push(
            `[part ${item.partId}] outcome invalide : ${String(item.outcome)}`,
          );
          continue;
      }

      // Un seul aller-retour : l'absence de ligne retournée signale une pièce inconnue.
      const updated = await db
        .update(schema.parts)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(schema.parts.id, item.partId))
        .returning({ id: schema.parts.id });
      if (updated.length === 0) {
        report.errors.push(`[part ${item.partId}] pièce inconnue`);
        continue;
      }

      if (item.outcome === "ambiguous") report.flaggedForReview++;
      else if (item.outcome === "error") report.errorsRecorded++;
      else report.updated++;
    } catch (err) {
      report.errors.push(`[part ${item.partId}] ${String(err)}`);
    }
  }

  return report;
}
