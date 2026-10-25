/**
 * Formatage d'affichage partagé (serveur et client).
 *
 * Le fuseau est fixé : un rendu serveur (UTC sur Vercel) et l'hydratation
 * côté navigateur doivent produire la même date.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" });

export function formatDate(value: Date | string): string {
  return DATE_FORMAT.format(new Date(value));
}

/** "1 234,56 €" ; "—" sans prix. Accepte le numeric de Postgres (chaîne). */
export function formatPrice(
  price: number | string | null | undefined,
  currency?: string | null,
): string {
  if (price == null || price === "") return "—";
  const value = typeof price === "number" ? price : Number(price);
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(value);
  } catch {
    // Code devise non ISO 4217 : affichage brut
    return `${value.toFixed(2)} ${currency ?? ""}`.trim();
  }
}

export const STATUS_LABELS: Record<string, string> = {
  active: "Fabriquée",
  obsolete: "Obsolète",
  unknown: "Inconnu",
};
