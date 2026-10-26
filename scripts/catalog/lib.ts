/**
 * Aides de saisie du catalogue étendu : une gamme = des valeurs communes
 * (fabricant, catégorie, statut, gabarit de description) + des lignes
 * compactes. Le résultat respecte le contrat d'ingestion (IngestPart).
 *
 * Règles de saisie :
 * - uniquement des références réelles connues avec certitude ; en cas de
 *   doute sur le statut, `unknown` plutôt qu'une affirmation ;
 * - `confidence` (0-100) : sous 60, la pièce apparaît dans /admin/review ;
 * - pas de prix ni d'offre (aucune donnée de prix vérifiée) ;
 * - pas de productUrl : la veille marque une pièce obsolète si l'URL
 *   renvoie 404, une URL approximative fausserait donc le statut.
 */
import type { Industry, IngestPart, PartStatus } from "../../src/lib/ingest-types";

export interface Extra {
  status?: PartStatus;
  /** Remplacement officiel chez le même fabricant (référence telle qu'écrite). */
  by?: string;
  /** Description propre à la ligne (sinon gabarit de la gamme). */
  desc?: string;
  confidence?: number;
  /** Autres écritures constructeur de la même référence (cross-références « oem »). */
  oem?: string[];
  /** Compatibles non officiels : "Fabricant|Référence". */
  compat?: string[];
  category?: string;
}

export type Row = readonly [reference: string, name: string, attributes?: Record<string, string> | null, extra?: Extra];

export interface Family {
  manufacturer: string;
  industry: Industry;
  category: string;
  status: PartStatus;
  confidence: number;
  /** Gabarit de description (français), reçoit le nom de la ligne. */
  describe: (name: string) => string;
}

export function family(base: Family, rows: Row[]): IngestPart[] {
  return rows.map(([reference, name, attributes, extra = {}]) => {
    const part: IngestPart = {
      manufacturer: base.manufacturer,
      industry: base.industry,
      reference,
      name,
      description: extra.desc ?? base.describe(name),
      status: extra.status ?? base.status,
      category: extra.category ?? base.category,
      confidenceScore: extra.confidence ?? base.confidence,
    };
    if (attributes && Object.keys(attributes).length > 0) part.attributes = attributes;
    if (extra.by) part.supersededBy = extra.by;
    if (extra.oem?.length) {
      part.crossReferences = extra.oem.map((ref) => ({ reference: ref, type: "oem" as const, brand: base.manufacturer }));
    }
    if (extra.compat?.length) part.compatibleWith = extra.compat;
    return part;
  });
}

/** Ligne obsolète remplacée par `by` (raccourci le plus fréquent). */
export function replacedBy(by: string, extra: Omit<Extra, "by" | "status"> = {}): Extra {
  return { ...extra, status: "obsolete", by };
}
