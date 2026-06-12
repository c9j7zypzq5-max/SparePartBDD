/**
 * Monétisation des liens revendeurs par affiliation.
 *
 * Chaque revendeur a une stratégie de décoration de lien, résolue à
 * l'exécution depuis des variables d'environnement. Tant qu'aucun
 * identifiant n'est configuré, l'URL est renvoyée telle quelle (clic simple,
 * non monétisé) — donc aucune régression, on active programme par programme.
 *
 * Stratégies supportées :
 *  - awin  : lien profond Awin (RS, Conrad, Farnell…) — nécessite un ID
 *            éditeur global (AWIN_PUBLISHER_ID) + un ID marchand par revendeur
 *            (AWIN_MID_<SLUG>). Format : awin1.com/cread.php?awinmid=&awinaffid=&ued=
 *  - query : ajout de paramètres à l'URL de destination (Mouser, eBay…).
 *
 * Les formats exacts de chaque réseau évoluent : ils sont centralisés ici,
 * une mise à jour = une ligne, sans toucher au reste de l'app.
 */

import { findResellerByUrl } from "@/lib/resellers";

interface DecorateResult {
  url: string;
  affiliated: boolean;
}

/** Construit un lien profond Awin si les deux identifiants sont présents. */
function awinDeepLink(merchantEnv: string, dest: string): DecorateResult {
  const publisher = process.env.AWIN_PUBLISHER_ID;
  const merchant  = process.env[merchantEnv];
  if (!publisher || !merchant) return { url: dest, affiliated: false };
  const ued = encodeURIComponent(dest);
  return {
    url: `https://www.awin1.com/cread.php?awinmid=${merchant}&awinaffid=${publisher}&ued=${ued}`,
    affiliated: true,
  };
}

/** Ajoute des paramètres de requête à l'URL de destination si l'ID est présent. */
function queryParams(dest: string, params: Record<string, string | undefined>): DecorateResult {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return { url: dest, affiliated: false };
  try {
    const u = new URL(dest);
    for (const [k, v] of entries) u.searchParams.set(k, v!);
    return { url: u.toString(), affiliated: true };
  } catch {
    return { url: dest, affiliated: false };
  }
}

/**
 * Décore une URL de destination avec l'affiliation du revendeur.
 * Renvoie l'URL (éventuellement réécrite) et si elle a bien été monétisée.
 */
export function decorateAffiliate(sellerSlug: string, dest: string): DecorateResult {
  switch (sellerSlug) {
    case "rs-components":
      return awinDeepLink("AWIN_MID_RS", dest);
    case "conrad":
      return awinDeepLink("AWIN_MID_CONRAD", dest);
    case "farnell":
      return awinDeepLink("AWIN_MID_FARNELL", dest);
    case "mouser":
      // Mouser : paramètre éditeur dédié (cf. votre tableau de bord affilié)
      return queryParams(dest, { affiliate_id: process.env.MOUSER_AFFILIATE_ID });
    case "digi-key":
      return queryParams(dest, { cur: process.env.DIGIKEY_AFFILIATE_ID });
    case "ebay":
      // eBay Partner Network : campid sur le lien (mkcid/toolid fixes)
      return process.env.EBAY_CAMPID
        ? queryParams(dest, { campid: process.env.EBAY_CAMPID, mkcid: "1", toolid: "10001" })
        : { url: dest, affiliated: false };
    default:
      // Rexel, Radwell… : pas de programme connu → lien simple
      return { url: dest, affiliated: false };
  }
}

/**
 * Lien interne de redirection traçante vers un revendeur.
 * Construit l'URL relative `/go?...` à mettre dans les `href` du site.
 */
export function goHref(opts: {
  to: string;
  seller: string;
  reference?: string;
  partId?: number;
}): string {
  const p = new URLSearchParams({ to: opts.to, seller: opts.seller });
  if (opts.reference) p.set("ref", opts.reference);
  if (opts.partId != null) p.set("part", String(opts.partId));
  return `/go?${p.toString()}`;
}

/**
 * Résout le `href` d'un lien sortant : passe par /go (traçage + affiliation)
 * si l'URL pointe vers un revendeur connu, sinon renvoie l'URL telle quelle.
 */
export function resolveResellerHref(
  url: string,
  reference?: string,
  partId?: number,
): string {
  const reseller = findResellerByUrl(url);
  if (!reseller) return url;
  return goHref({ to: url, seller: reseller.slug, reference, partId });
}
