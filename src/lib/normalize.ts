/**
 * Normalise une référence pour le matching : majuscules, suppression de tout
 * ce qui n'est pas alphanumérique. "11 42 7 953 129" et "11-42-7953129"
 * deviennent toutes deux "11427953129".
 */
export function normalizeReference(reference: string): string {
  if (!reference) return "";
  return reference.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function referenceSlug(reference: string): string {
  if (!reference) return "";
  return normalizeReference(reference).toLowerCase();
}

export function slugify(value: string): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
