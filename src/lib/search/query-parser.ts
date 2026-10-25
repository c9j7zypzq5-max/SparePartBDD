import { normalizeReference, slugify } from "@/lib/normalize";

export interface BrandRef {
  id: number;
  slug: string;
  name: string;
}

export interface RefTerm {
  /** Référence normalisée à chercher */
  term: string;
  /** Poids (0–1] appliqué au score de correspondance de ce terme */
  weight: number;
}

export interface ParsedQuery {
  /** Fabricant reconnu dans la requête ("Siemens 6ES7…"), retiré du reste */
  brand: BrandRef | null;
  /** Texte restant, pour la recherche plein texte */
  text: string;
  /** Références candidates : texte entier (poids 1) + jetons qui ressemblent à une référence */
  refTerms: RefTerm[];
}

/** "Rockwell Automation", "Phoenix Contact"… : jusqu'à 3 mots par nom de fabricant. */
const MAX_BRAND_WORDS = 3;
const MAX_REF_TERMS = 6;

/**
 * Découpe une requête utilisateur en fabricant / références / texte.
 *
 * - "Siemens 6ES7214-1AG40-0XB0" → fabricant Siemens, référence 6ES72141AG400XB0
 * - "remplacement 6ES7214-1AG31" → référence 6ES72141AG31 (le jeton seul)
 * - "11 42 7 953 129"            → référence 11427953129 (le texte entier)
 * - "alimentation serveur"       → texte seul, aucune référence
 */
export function parseSearchQuery(
  query: string,
  brandsBySlug: ReadonlyMap<string, BrandRef>,
): ParsedQuery {
  const tokens = query.trim().split(/\s+/).filter(Boolean);

  let brand: BrandRef | null = null;
  let remaining = tokens;
  search: for (let size = Math.min(MAX_BRAND_WORDS, tokens.length); size >= 1; size--) {
    for (let start = 0; start + size <= tokens.length; start++) {
      const candidate = brandsBySlug.get(slugify(tokens.slice(start, start + size).join(" ")));
      if (candidate) {
        brand = candidate;
        remaining = [...tokens.slice(0, start), ...tokens.slice(start + size)];
        break search;
      }
    }
  }

  const terms = new Map<string, number>();
  const add = (term: string, weight: number) =>
    terms.set(term, Math.max(weight, terms.get(term) ?? 0));

  const whole = normalizeReference(remaining.join(""));
  // Plusieurs mots sans aucun chiffre : c'est du langage naturel, pas une référence.
  if (whole && (remaining.length === 1 || /\d/.test(whole))) add(whole, 1);

  // Chaque jeton « référence » pèse sa part de la référence saisie : dans
  // "6ES7 214-1AG40-0XB0", le fragment "6ES7" ne doit pas faire remonter
  // toutes les pièces S7 au même niveau que la référence complète.
  const refTokens = remaining
    .map(normalizeReference)
    .filter((t) => t.length >= 4 && /\d/.test(t));
  const refMass = refTokens.reduce((sum, t) => sum + t.length, 0);
  for (const token of refTokens) add(token, token.length / refMass);

  return {
    brand,
    text: remaining.join(" "),
    refTerms: [...terms]
      .map(([term, weight]) => ({ term, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, MAX_REF_TERMS),
  };
}
