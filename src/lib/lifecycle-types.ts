import type { PartStatus } from "@/lib/ingest-types";

/**
 * Types partagés entre les routes /api/lifecycle/* et le script de veille
 * scripts/lifecycle/check.ts (Mac mini). C'est le contrat du contrôle
 * hebdomadaire « cette pièce est-elle toujours fabriquée/commercialisée ? ».
 */

/**
 * Verdict du contrôle d'une page produit :
 * - active    : la page montre que la pièce est toujours commercialisée
 * - obsolete  : signal sûr d'arrêt (HTTP 404/410 ou mention explicite)
 * - ambiguous : aucun signal fiable — la pièce sera marquée « à vérifier »
 * - error     : erreur transitoire (timeout, 5xx, anti-bot) — aucun changement
 */
export type LifecycleOutcome = "active" | "obsolete" | "ambiguous" | "error";

/** Pièce due pour un contrôle, renvoyée par GET /api/lifecycle/pending. */
export interface LifecyclePendingPart {
  id: number;
  manufacturer: string;
  reference: string;
  productUrl: string;
  status: PartStatus;
  /** ISO 8601, null si jamais contrôlée */
  lifecycleCheckedAt: string | null;
}

export interface LifecycleReportItem {
  partId: number;
  outcome: LifecycleOutcome;
  /** Trace du signal (ex : "HTTP 404", "mot-clé 'discontinued'") */
  evidence?: string;
  /** ISO 8601 — défaut : date de réception côté serveur */
  checkedAt?: string;
}

export interface LifecycleReportPayload {
  /** Identifiant du run (ex : "lifecycle-mac-mini-2026-06-15") */
  source: string;
  results: LifecycleReportItem[];
}

export interface LifecycleReportResult {
  /** Statuts mis à jour (active ou obsolete) */
  updated: number;
  /** Pièces marquées « à vérifier » */
  flaggedForReview: number;
  /** Erreurs transitoires consignées (statut inchangé) */
  errorsRecorded: number;
  errors: string[];
}
