/**
 * Catalogue des revendeurs / distributeurs connus (RS, Farnell, Rexel, etc.).
 *
 * Utilisé par :
 *  - le site (page pièce) : chaque référence affiche au moins un revendeur,
 *    même sans offre relevée en base, via des liens de recherche garantis ;
 *  - le script scripts/ingest/accumulate.ts : génération d'au moins une offre
 *    revendeur par référence et reconnaissance des pages produit revendeur
 *    dans les résultats de recherche.
 *
 * Import relatif (pas d'alias @/) pour rester chargeable par tsx depuis
 * scripts/ sans dépendre de la résolution de paths Next.
 */
import type { Industry, PartStatus, SellerType } from "./ingest-types";

export interface Reseller {
  /** Nom affiché — slugify(name) doit donner `slug` (clé d'upsert vendeur) */
  name: string;
  slug: string;
  type: SellerType;
  website: string;
  country?: string;
  /** Industries couvertes ; "all" = revendeur généraliste */
  industries: Industry[] | "all";
  /** Fragments de domaine pour reconnaître une URL produit de ce revendeur */
  domains: string[];
  /** URL de recherche du revendeur pour une référence — fonctionne toujours */
  searchUrl: (reference: string) => string;
}

export const RESELLERS: Reseller[] = [
  {
    name: "RS Components",
    slug: "rs-components",
    type: "distributeur_officiel",
    website: "https://fr.rs-online.com",
    country: "FR",
    industries: ["industrie", "electronique", "informatique", "hvac"],
    domains: ["rs-online.", "rscomponents.", "electrocomponents."],
    searchUrl: (ref) =>
      `https://fr.rs-online.com/web/c/?searchTerm=${encodeURIComponent(ref)}`,
  },
  {
    name: "Farnell",
    slug: "farnell",
    type: "distributeur_officiel",
    website: "https://fr.farnell.com",
    country: "FR",
    industries: ["electronique", "industrie", "informatique"],
    domains: ["farnell.", "element14.", "newark."],
    searchUrl: (ref) =>
      `https://fr.farnell.com/search?st=${encodeURIComponent(ref)}`,
  },
  {
    name: "Rexel",
    slug: "rexel",
    type: "distributeur_officiel",
    website: "https://www.rexel.fr",
    country: "FR",
    industries: ["industrie", "hvac"],
    domains: ["rexel."],
    searchUrl: (ref) =>
      `https://www.rexel.fr/frx/search?text=${encodeURIComponent(ref)}`,
  },
  {
    name: "Mouser",
    slug: "mouser",
    type: "distributeur_officiel",
    website: "https://www.mouser.fr",
    country: "FR",
    industries: ["electronique", "informatique"],
    domains: ["mouser."],
    searchUrl: (ref) =>
      `https://www.mouser.fr/c/?q=${encodeURIComponent(ref)}`,
  },
  {
    name: "Digi-Key",
    slug: "digi-key",
    type: "distributeur_officiel",
    website: "https://www.digikey.fr",
    country: "FR",
    industries: ["electronique"],
    domains: ["digikey."],
    searchUrl: (ref) =>
      `https://www.digikey.fr/fr/products/result?keywords=${encodeURIComponent(ref)}`,
  },
  {
    name: "Conrad",
    slug: "conrad",
    type: "distributeur_officiel",
    website: "https://www.conrad.fr",
    country: "FR",
    industries: "all",
    domains: ["conrad."],
    searchUrl: (ref) =>
      `https://www.conrad.fr/fr/search.html?search=${encodeURIComponent(ref)}`,
  },
  {
    name: "Radwell",
    slug: "radwell",
    type: "reconditionne",
    website: "https://www.radwell.com",
    country: "US",
    industries: ["industrie", "electronique", "hvac"],
    domains: ["radwell."],
    searchUrl: (ref) =>
      `https://www.radwell.com/en-US/search/?QueryText=${encodeURIComponent(ref)}`,
  },
  {
    name: "eBay",
    slug: "ebay",
    type: "occasion",
    website: "https://www.ebay.fr",
    country: "FR",
    industries: "all",
    domains: ["ebay."],
    searchUrl: (ref) =>
      `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(ref)}`,
  },
];

/** Ordre d'affichage par type selon le statut de la pièce. */
const TYPE_RANK_ACTIVE: Record<string, number> = {
  distributeur_officiel: 0,
  aftermarket: 1,
  reconditionne: 2,
  occasion: 3,
  constructeur: 4,
};
const TYPE_RANK_OBSOLETE: Record<string, number> = {
  reconditionne: 0,
  occasion: 1,
  aftermarket: 2,
  distributeur_officiel: 3,
  constructeur: 4,
};

/**
 * Revendeurs pertinents pour une pièce. Renvoie TOUJOURS au moins un
 * revendeur : les généralistes (Conrad, eBay) servent de filet de sécurité.
 * Pour une pièce obsolète, le reconditionné et l'occasion passent en tête.
 */
export function resellersForPart(
  industry: string,
  status?: string,
): Reseller[] {
  let list = RESELLERS.filter(
    (r) => r.industries === "all" || r.industries.includes(industry as Industry),
  );
  if (list.length === 0) list = RESELLERS.filter((r) => r.industries === "all");

  const rank =
    status === ("obsolete" satisfies PartStatus)
      ? TYPE_RANK_OBSOLETE
      : TYPE_RANK_ACTIVE;
  return [...list].sort(
    (a, b) => (rank[a.type] ?? 9) - (rank[b.type] ?? 9),
  );
}

/** Retrouve le revendeur correspondant à une URL (page produit revendeur). */
export function findResellerByUrl(url: string): Reseller | undefined {
  const lower = url.toLowerCase();
  return RESELLERS.find((r) => r.domains.some((d) => lower.includes(d)));
}
