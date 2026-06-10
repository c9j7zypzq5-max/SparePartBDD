/**
 * Pattern d'ingestion : chaque source de données (catalogue OEM, API
 * marketplace, flux d'affiliation, scraper) implémente SourceAdapter et
 * produit des enregistrements normalisés que le pipeline insère/met à jour
 * en base via la référence normalisée comme clé de matching.
 *
 * Le pipeline d'orchestration (dédoublonnage, upsert, scoring de confiance)
 * sera ajouté quand la première vraie source sera branchée.
 */

export interface RawPart {
  manufacturerName: string;
  industry:
    | "industrie"
    | "informatique"
    | "automobile"
    | "electromenager"
    | "hvac"
    | "electronique";
  reference: string;
  name: string;
  description?: string;
  status?: "active" | "obsolete" | "unknown";
  categoryName?: string;
  attributes?: Record<string, string>;
  /** Références équivalentes connues de la source */
  crossReferences?: { reference: string; type: string; brand?: string }[];
  /** Référence officielle de remplacement si la pièce est obsolète */
  supersededBy?: string;
}

export interface RawOffer {
  manufacturerName: string;
  reference: string;
  sellerName: string;
  sellerType:
    | "constructeur"
    | "distributeur_officiel"
    | "aftermarket"
    | "reconditionne"
    | "occasion";
  price?: number;
  currency?: string;
  availability?: string;
  url: string;
}

export interface SourceAdapter {
  /** Identifiant de la source (ex : "ebay-browse-api", "tecdoc", "oem-bosch") */
  readonly sourceId: string;
  /** Itère sur les pièces de la source (pagination gérée par l'adapter). */
  fetchParts(): AsyncIterable<RawPart>;
  /** Itère sur les offres vendeurs de la source. */
  fetchOffers(): AsyncIterable<RawOffer>;
}
