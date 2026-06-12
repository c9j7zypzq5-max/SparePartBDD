/**
 * Types partagés entre l'API /api/ingest, le pipeline d'upsert et le script
 * push. C'est le contrat que les sessions Ollama doivent respecter.
 */

export type Industry =
  | "industrie"
  | "informatique"
  | "automobile"
  | "electromenager"
  | "hvac"
  | "electronique";

export type PartStatus = "active" | "obsolete" | "unknown";
export type ReferenceType = "oem" | "aftermarket" | "ean" | "mpn";
export type SellerType =
  | "constructeur"
  | "distributeur_officiel"
  | "aftermarket"
  | "reconditionne"
  | "occasion";

export interface IngestOffer {
  /** Nom du vendeur (ex : "Radwell", "ServerSupply", "eBay") */
  sellerName: string;
  sellerType: SellerType;
  sellerWebsite?: string;
  sellerCountry?: string;
  price?: number;
  /** Devise ISO 4217 (ex : "EUR", "USD") — défaut "EUR" */
  currency?: string;
  availability?: string;
  /** URL directe vers la page produit du vendeur */
  url: string;
}

export interface IngestPart {
  manufacturer: string;
  manufacturerWebsite?: string;
  industry: Industry;
  /** Référence telle qu'écrite par le fabricant (ex : "6ES7214-1AG40-0XB0") */
  reference: string;
  name: string;
  description?: string;
  status?: PartStatus;
  category?: string;
  /**
   * URL de la page produit OFFICIELLE du fabricant (pas un vendeur).
   * Sert au contrôle hebdomadaire « toujours fabriquée ? » du Mac mini.
   */
  productUrl?: string;
  /** URL du datasheet PDF officiel */
  datasheetUrl?: string;
  /** Timestamp ISO de la dernière vérification HEAD de l'URL produit */
  urlVerifiedAt?: string;
  /** Score de confiance Ollama [0-100] moyen sur name/description/category/status */
  confidenceScore?: number;
  /** Attributs techniques libres (ex : {"Tension": "24V DC", "Courant": "5A"}) */
  attributes?: Record<string, string>;
  crossReferences?: {
    reference: string;
    type: ReferenceType;
    brand?: string;
  }[];
  /**
   * Référence officielle de remplacement chez le MÊME fabricant.
   * Si la référence de remplacement est d'un autre fabricant, utilise
   * compatibleWith à la place.
   */
  supersededBy?: string;
  /**
   * Pièces compatibles non officielles. Format : "NomFabricant|Référence".
   * Ex : ["Schneider Electric|LC1D18M7", "TE Connectivity|1-1415899-1"]
   */
  compatibleWith?: string[];
  offers?: IngestOffer[];
}

export interface IngestPayload {
  /** Identifiant de la session (ex : "ollama-batch-001", "rockwell-scrape") */
  source: string;
  parts: IngestPart[];
}

export interface IngestResult {
  partsInserted: number;
  partsUpdated: number;
  offersInserted: number;
  errors: string[];
}
