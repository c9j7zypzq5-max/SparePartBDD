/**
 * Lecture défensive des paramètres de requête : une valeur absente, invalide
 * ou hors bornes ne doit jamais atteindre SQL (LIMIT NaN, OFFSET négatif…).
 */

/** Entier borné ; `fallback` si la valeur est absente ou non numérique. */
export function intParam(
  value: string | null | undefined,
  opts: { fallback: number; min: number; max: number },
): number {
  if (value == null || value.trim() === "") return opts.fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return opts.fallback;
  return Math.min(Math.max(n, opts.min), opts.max);
}

/** Valeur d'une liste fermée, ou undefined si elle n'en fait pas partie. */
export function enumParam<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | undefined {
  return value != null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}
