/**
 * Normalise une référence pour le matching : majuscules, suppression de tout
 * ce qui n'est pas alphanumérique. "11 42 7 953 129" et "11-42-7953129"
 * deviennent toutes deux "11427953129".
 */
export function normalizeReference(reference: string): string {
  return reference.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Slug URL d'une référence : version normalisée en minuscules. */
export function referenceSlug(reference: string): string {
  return normalizeReference(reference).toLowerCase();
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
