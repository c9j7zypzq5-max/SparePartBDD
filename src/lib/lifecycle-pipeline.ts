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

      const existing = await db
        .select({ id: schema.parts.id, status: schema.parts.status })
        .from(schema.parts)
        .where(eq(schema.parts.id, item.partId))
        .limit(1);
      if (existing.length === 0) {
        report.errors.push(`[part ${item.partId}] pièce inconnue`);
        continue;
      }

      switch (item.outcome) {
        case "active":
        case "obsolete":
          await db
            .update(schema.parts)
            .set({
              status: item.outcome,
              needsReview: false,
              lifecycleCheckedAt: checkedAt,
              lifecycleNote: item.evidence ?? `${source} : page produit active`,
              updatedAt: new Date(),
            })
            .where(eq(schema.parts.id, item.partId));
          // Événement de changement de statut (webhooks Business)
          if (item.outcome !== existing[0].status) {
            await db.insert(schema.partStatusEvents).values({
              partId: item.partId,
              oldStatus: existing[0].status,
              newStatus: item.outcome,
              source,
            });
          }
          report.updated++;
          break;

        case "ambiguous":
          await db
            .update(schema.parts)
            .set({
              needsReview: true,
              lifecycleCheckedAt: checkedAt,
              lifecycleNote: item.evidence ?? "aucun signal détecté",
              updatedAt: new Date(),
            })
            .where(eq(schema.parts.id, item.partId));
          report.flaggedForReview++;
          break;

        case "error":
          // Erreur transitoire : on ne touche pas à lifecycleCheckedAt afin
          // que la pièce reste dans la file du prochain run.
          await db
            .update(schema.parts)
            .set({
              lifecycleNote: `erreur : ${item.evidence ?? "inconnue"}`,
              updatedAt: new Date(),
            })
            .where(eq(schema.parts.id, item.partId));
          report.errorsRecorded++;
          break;

        default:
          report.errors.push(
            `[part ${item.partId}] outcome invalide : ${String(item.outcome)}`,
          );
      }
    } catch (err) {
      report.errors.push(`[part ${item.partId}] ${String(err)}`);
    }
  }

  return report;
}
