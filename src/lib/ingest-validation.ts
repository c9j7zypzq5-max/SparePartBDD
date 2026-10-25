import { normalizeReference, slugify } from "@/lib/normalize";
import {
  INDUSTRIES,
  PART_STATUSES,
  REFERENCE_TYPES,
  SELLER_TYPES,
  type IngestOffer,
  type IngestPart,
} from "@/lib/ingest-types";

/**
 * Validation et nettoyage des lots reçus par /api/ingest. L'API est la
 * frontière de confiance : le JSON peut venir d'un LLM ou d'un fichier
 * poussé à la main, sans validation préalable.
 */

/** Chaîne non vide après trim, ou null. */
export function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Objet clé/valeur non vide, ou null (un {} renvoyé par un LLM n'efface rien). */
export function cleanRecord(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([k, v]) => k.trim() && v != null && String(v).trim())
    .map(([k, v]) => [k.trim(), String(v).trim()] as const);
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

/** Valide les champs indispensables d'une pièce ; renvoie le problème, ou null. */
export function validatePart(raw: IngestPart): string | null {
  if (!raw || typeof raw !== "object") return "entrée invalide";
  if (!clean(raw.manufacturer) || !slugify(raw.manufacturer)) return "manufacturer manquant";
  if (!clean(raw.reference) || !normalizeReference(raw.reference)) return "reference manquante";
  if (!clean(raw.name)) return "name manquant";
  if (!oneOf(raw.industry, INDUSTRIES)) return `industry invalide (${String(raw.industry)})`;
  if (raw.status != null && !oneOf(raw.status, PART_STATUSES)) return `status invalide (${String(raw.status)})`;
  return null;
}

/** Problème d'une offre, ou null si elle est exploitable. */
export function offerProblem(offer: IngestOffer): string | null {
  if (!offer || typeof offer !== "object") return "offre invalide";
  if (!clean(offer.sellerName) || !slugify(offer.sellerName)) return "sellerName manquant";
  if (!oneOf(offer.sellerType, SELLER_TYPES)) return `sellerType invalide (${String(offer.sellerType)})`;
  if (!isHttpUrl(offer.url)) return "url invalide";
  if (offer.price != null && !(typeof offer.price === "number" && Number.isFinite(offer.price) && offer.price >= 0)) {
    return `prix invalide (${String(offer.price)})`;
  }
  return null;
}

/** Cross-références exploitables (référence non vide, type connu). */
export function validCrossReferences(raw: IngestPart): NonNullable<IngestPart["crossReferences"]> {
  return (raw.crossReferences ?? []).filter(
    (x) => x && clean(x.reference) && normalizeReference(x.reference) && oneOf(x.type, REFERENCE_TYPES),
  );
}
