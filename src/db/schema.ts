import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Type tsvector PostgreSQL (recherche full-text) — non géré nativement par Drizzle. */
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

/**
 * Modèle de données du moteur de recherche de pièces détachées.
 *
 * Principe central : une `part` est une pièce identifiée par son fabricant
 * + sa référence OEM normalisée. Tout le reste (références alternatives,
 * remplacements, compatibles, offres vendeurs) gravite autour.
 */

export const industryEnum = pgEnum("industry", [
  // Verticales prioritaires du lancement
  "industrie",
  "informatique",
  // Extensions prévues
  "automobile",
  "electromenager",
  "hvac",
  "electronique",
]);

export const partStatusEnum = pgEnum("part_status", [
  "active", // encore fabriquée
  "obsolete", // plus fabriquée
  "unknown",
]);

export const referenceTypeEnum = pgEnum("reference_type", [
  "oem", // référence constructeur alternative (autre format, ancien catalogue…)
  "aftermarket", // référence équivalente d'un fabricant aftermarket
  "ean",
  "mpn",
]);

export const sellerTypeEnum = pgEnum("seller_type", [
  "constructeur",
  "distributeur_officiel",
  "aftermarket",
  "reconditionne",
  "occasion",
]);

export const manufacturers = pgTable(
  "manufacturers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    industry: industryEnum("industry").notNull(),
    website: text("website"),
  },
  (t) => [uniqueIndex("manufacturers_slug_idx").on(t.slug)],
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    industry: industryEnum("industry").notNull(),
    parentId: integer("parent_id"),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)],
);

export const parts = pgTable(
  "parts",
  {
    id: serial("id").primaryKey(),
    manufacturerId: integer("manufacturer_id")
      .notNull()
      .references(() => manufacturers.id),
    categoryId: integer("category_id").references(() => categories.id),
    /** Référence telle qu'affichée (ex : "00754870", "11 42 7 953 129") */
    referenceRaw: text("reference_raw").notNull(),
    /** Référence normalisée pour le matching (majuscules, alphanumérique seul) */
    referenceNormalized: text("reference_normalized").notNull(),
    /** Slug URL : référence normalisée en minuscules */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: partStatusEnum("status").notNull().default("unknown"),
    imageUrl: text("image_url"),
    /** Attributs techniques libres (dimensions, voltage, matière…) */
    attributes: jsonb("attributes").$type<Record<string, string>>(),
    /** URL de la page produit officielle du fabricant (sert à la veille hebdo) */
    productUrl: text("product_url"),
    /** URL du datasheet PDF officiel */
    datasheetUrl: text("datasheet_url"),
    /** Dernière vérification que l'URL produit répond (HEAD request) */
    urlVerifiedAt: timestamp("url_verified_at"),
    /** Score de confiance Ollama [0-100] sur les champs name/description/category/status */
    confidenceScore: integer("confidence_score"),
    /** Dernière vérification du cycle de vie via productUrl */
    lifecycleCheckedAt: timestamp("lifecycle_checked_at"),
    /** Signal ambigu détecté lors de la veille — à vérifier manuellement */
    needsReview: boolean("needs_review").notNull().default(false),
    /** Trace du dernier contrôle (ex : "HTTP 404", "mot-clé 'discontinued'") */
    lifecycleNote: text("lifecycle_note"),
    /**
     * Vecteur full-text (français) sur name + description, maintenu par
     * PostgreSQL (colonne générée). Interrogé via l'opérateur @@ avec
     * websearch_to_tsquery — voir src/lib/search/postgres-search.ts.
     */
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      (): ReturnType<typeof sql> =>
        sql`to_tsvector('french', name || ' ' || coalesce(description, ''))`,
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("parts_manufacturer_ref_idx").on(
      t.manufacturerId,
      t.referenceNormalized,
    ),
    index("parts_ref_normalized_idx").on(t.referenceNormalized),
    // Recherche full-text : index GIN sur le tsvector généré
    index("parts_search_vector_idx").using("gin", t.searchVector),
    // Recherche approchée de référence : index GIN trigram (opérateur %)
    // Nécessite l'extension pg_trgm : CREATE EXTENSION IF NOT EXISTS pg_trgm;
    index("parts_ref_trgm_idx").using(
      "gin",
      t.referenceNormalized.op("gin_trgm_ops"),
    ),
  ],
);

/** Références alternatives pointant vers une même pièce (cross-references). */
export const partReferences = pgTable(
  "part_references",
  {
    id: serial("id").primaryKey(),
    partId: integer("part_id")
      .notNull()
      .references(() => parts.id),
    reference: text("reference").notNull(),
    referenceNormalized: text("reference_normalized").notNull(),
    type: referenceTypeEnum("type").notNull(),
    /** Marque émettrice de la référence (ex : "Febi", "Bosch") */
    brand: text("brand"),
    source: text("source"),
  },
  (t) => [
    index("part_references_normalized_idx").on(t.referenceNormalized),
    uniqueIndex("part_references_part_ref_idx").on(
      t.partId,
      t.referenceNormalized,
    ),
    // Recherche approchée sur les cross-références (opérateur % de pg_trgm)
    index("part_references_ref_trgm_idx").using(
      "gin",
      t.referenceNormalized.op("gin_trgm_ops"),
    ),
  ],
);

/** Chaîne de remplacement officielle : oldPart a été remplacée par newPart. */
export const supersessions = pgTable(
  "supersessions",
  {
    id: serial("id").primaryKey(),
    oldPartId: integer("old_part_id")
      .notNull()
      .references(() => parts.id),
    newPartId: integer("new_part_id")
      .notNull()
      .references(() => parts.id),
    source: text("source"),
    note: text("note"),
  },
  (t) => [
    uniqueIndex("supersessions_old_new_idx").on(t.oldPartId, t.newPartId),
  ],
);

/** Pièces compatibles alternatives (non officielles), avec score de confiance. */
export const compatibilities = pgTable(
  "compatibilities",
  {
    id: serial("id").primaryKey(),
    partId: integer("part_id")
      .notNull()
      .references(() => parts.id),
    compatiblePartId: integer("compatible_part_id")
      .notNull()
      .references(() => parts.id),
    /** 0..1 — confiance dans la compatibilité selon la source */
    confidence: real("confidence").notNull().default(0.5),
    source: text("source"),
  },
  (t) => [
    uniqueIndex("compatibilities_part_compat_idx").on(
      t.partId,
      t.compatiblePartId,
    ),
  ],
);

export const sellers = pgTable(
  "sellers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: sellerTypeEnum("type").notNull(),
    website: text("website"),
    country: text("country"),
  },
  (t) => [uniqueIndex("sellers_slug_idx").on(t.slug)],
);

/** Offre d'un vendeur pour une pièce, relevée à une date donnée. */
export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),
    partId: integer("part_id")
      .notNull()
      .references(() => parts.id),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => sellers.id),
    price: numeric("price", { precision: 12, scale: 2 }),
    currency: text("currency").default("EUR"),
    availability: text("availability"),
    url: text("url").notNull(),
    scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
  },
  (t) => [index("offers_part_idx").on(t.partId)],
);

export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "pending",
  "approved",
  "rejected",
]);

/** Suggestions d'ajout de références par les utilisateurs. */
export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull(),
  manufacturer: text("manufacturer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: suggestionStatusEnum("status").notNull().default("pending"),
});

/** Abonnements email aux changements de statut d'une liste de pièces. */
export const watchlistSubscriptions = pgTable("watchlist_subscriptions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  references: text("references").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── API publique payante ───────────────────────────────────────────────────────

export const apiKeyPlanEnum = pgEnum("api_key_plan", [
  "free",     // 1 000 req/mois — gratuit
  "pro",      // 50 000 req/mois — 49 €/mois
  "business", // 250 000 req/mois — 149 €/mois
]);

export const PLAN_QUOTAS: Record<string, number> = {
  free:     1_000,
  pro:      50_000,
  business: 250_000,
};

/**
 * Clics sortants vers les revendeurs (monétisation par affiliation).
 * Enregistré par la route /go avant redirection, pour les statistiques.
 */
export const outboundClicks = pgTable(
  "outbound_clicks",
  {
    id: serial("id").primaryKey(),
    /** Pièce d'origine du clic (null si lien hors page pièce) */
    partId: integer("part_id").references(() => parts.id),
    /** Slug du revendeur ciblé (ex : "rs-components") */
    sellerSlug: text("seller_slug").notNull(),
    /** Référence recherchée au moment du clic */
    reference: text("reference"),
    /** true si l'URL a été décorée d'un identifiant d'affiliation */
    affiliated: boolean("affiliated").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("outbound_clicks_seller_idx").on(t.sellerSlug),
    index("outbound_clicks_created_idx").on(t.createdAt),
  ],
);

/**
 * Changements de statut des pièces (active ↔ obsolete), alimenté par les
 * pipelines d'ingestion et de veille. Consommé par le cron de livraison
 * des webhooks (plan Business).
 */
export const partStatusEvents = pgTable(
  "part_status_events",
  {
    id: serial("id").primaryKey(),
    partId: integer("part_id")
      .notNull()
      .references(() => parts.id),
    oldStatus: partStatusEnum("old_status").notNull(),
    newStatus: partStatusEnum("new_status").notNull(),
    /** Pipeline à l'origine du changement (source d'ingestion ou veille) */
    source: text("source"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("part_status_events_created_idx").on(t.createdAt)],
);

/**
 * Webhooks des clients API (plan Business) : POST signé HMAC-SHA256 à chaque
 * changement de statut d'une pièce surveillée. Le secret sert uniquement à
 * signer les payloads (en-tête X-SPB-Signature) — il est montré une fois à
 * la création.
 */
export const apiWebhooks = pgTable(
  "api_webhooks",
  {
    id: serial("id").primaryKey(),
    apiKeyId: integer("api_key_id")
      .notNull()
      .references(() => apiKeys.id),
    /** Destination HTTPS du POST */
    url: text("url").notNull(),
    /** Secret de signature HMAC (whsec_…) */
    secret: text("secret").notNull(),
    /** Références surveillées (normalisées) — vide = tout le catalogue */
    references: text("references").array().notNull().default([]),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastDeliveryAt: timestamp("last_delivery_at"),
    /** Dernier code HTTP reçu (debug client) */
    lastDeliveryStatus: integer("last_delivery_status"),
  },
  (t) => [index("api_webhooks_key_idx").on(t.apiKeyId)],
);

/** Suivi de livraison : un événement n'est tenté que 3 fois par webhook. */
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: serial("id").primaryKey(),
    webhookId: integer("webhook_id")
      .notNull()
      .references(() => apiWebhooks.id),
    eventId: integer("event_id")
      .notNull()
      .references(() => partStatusEvents.id),
    attempts: integer("attempts").notNull().default(0),
    success: boolean("success").notNull().default(false),
    responseStatus: integer("response_status"),
    lastAttemptAt: timestamp("last_attempt_at"),
  },
  (t) => [
    uniqueIndex("webhook_deliveries_pair_idx").on(t.webhookId, t.eventId),
  ],
);

/** Clés d'accès à l'API publique. La clé brute n'est jamais stockée — uniquement son hash SHA-256. */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: serial("id").primaryKey(),
    /** SHA-256 de la clé brute (jamais stockée) */
    keyHash: text("key_hash").notNull(),
    /** 12 premiers caractères de la clé (affichage, non secret) */
    keyPrefix: text("key_prefix").notNull(),
    ownerEmail: text("owner_email").notNull(),
    plan: apiKeyPlanEnum("plan").notNull().default("free"),
    monthlyQuota: integer("monthly_quota").notNull().default(PLAN_QUOTAS.free),
    usageThisMonth: integer("usage_this_month").notNull().default(0),
    /** Début de la période de facturation courante */
    usageResetAt: timestamp("usage_reset_at").notNull().defaultNow(),
    /**
     * Facturation à l'usage au-delà du quota (plans payants uniquement).
     * Si false : 429 au dépassement. Si true : les requêtes passent et le
     * dépassement est facturé via les Billing Meters Stripe.
     */
    overageEnabled: boolean("overage_enabled").notNull().default(false),
    /** Requêtes hors quota déjà rapportées à Stripe (meter events) pour la période courante */
    overageReported: integer("overage_reported").notNull().default(0),
    active: boolean("active").notNull().default(true),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (t) => [
    uniqueIndex("api_keys_hash_idx").on(t.keyHash),
    index("api_keys_email_idx").on(t.ownerEmail),
  ],
);
