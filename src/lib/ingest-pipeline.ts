import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeReference, referenceSlug, slugify } from "@/lib/normalize";
import type { IngestOffer, IngestPart, IngestResult } from "@/lib/ingest-types";
import {
  clean,
  cleanRecord,
  isHttpUrl,
  offerProblem,
  parseDate,
  validatePart,
  validCrossReferences,
} from "@/lib/ingest-validation";

const { categories, compatibilities, manufacturers, offers, partReferences, parts, sellers, supersessions } = schema;

/**
 * Ingère un lot de pièces dans la base. Chaque pièce est upsertée dans sa
 * propre transaction (tout ou rien : pièce, cross-refs, offres) ; les erreurs
 * par pièce sont collectées sans interrompre le reste du lot.
 *
 * Mise à jour d'une pièce existante — une source ne peut qu'enrichir :
 * - un champ absent ou vide du lot (description, catégorie, attributs, specs,
 *   URLs, score) conserve la valeur en base ;
 * - le statut n'est remplacé que par "active"/"obsolete", et jamais quand la
 *   veille hebdomadaire a tranché sur preuve (lifecycleCheckedAt renseigné
 *   sans needsReview) : un LLM ne contredit pas un HTTP 404 constaté.
 * - fabricants, catégories et vendeurs gardent le nom et le type de leur
 *   première création (les variantes de casse d'un même slug ne les
 *   renomment plus d'un lot à l'autre).
 *
 * Deux passes : d'abord les pièces, puis les relations entre pièces
 * (supersessions, compatibilités), résolues dans le lot ou à défaut en base.
 */
export async function ingestParts(
  rawParts: IngestPart[],
  source: string,
): Promise<IngestResult> {
  const result: IngestResult = {
    partsInserted: 0,
    partsUpdated: 0,
    offersInserted: 0,
    errors: [],
    warnings: [],
  };
  const ids = new LookupCache();
  // "manufacturerSlug|referenceNormalized" → partId, pour la deuxième passe
  const partRegistry = new Map<string, number>();

  // ── Passe 1 : pièces, cross-refs, offres ─────────────────────────────────

  for (const raw of rawParts) {
    const label = `[${raw?.manufacturer ?? "?"} ${raw?.reference ?? "?"}]`;
    const problem = validatePart(raw);
    if (problem) {
      result.errors.push(`${label} ${problem}`);
      continue;
    }
    try {
      const outcome = await ingestOne(raw, source, ids, result.warnings);
      partRegistry.set(partKey(raw.manufacturer, raw.reference), outcome.partId);
      if (outcome.inserted) result.partsInserted++;
      else result.partsUpdated++;
      result.offersInserted += outcome.offersWritten;
    } catch (err) {
      result.errors.push(`${label} ${String(err)}`);
    }
  }

  // ── Passe 2 : supersessions et compatibilités ─────────────────────────────

  const resolvePart = async (manufacturer: string, reference: string) => {
    const key = partKey(manufacturer, reference);
    const known = partRegistry.get(key);
    if (known) return known;
    const [row] = await db
      .select({ id: parts.id })
      .from(parts)
      .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
      .where(
        and(
          eq(manufacturers.slug, slugify(manufacturer)),
          eq(parts.referenceNormalized, normalizeReference(reference)),
        ),
      )
      .limit(1);
    if (row) partRegistry.set(key, row.id);
    return row?.id;
  };

  for (const raw of rawParts) {
    const oldPartId = raw?.supersededBy ? partRegistry.get(partKey(raw.manufacturer, raw.reference)) : undefined;
    if (!oldPartId || !raw.supersededBy) continue;
    const label = `[supersession ${raw.manufacturer} ${raw.reference}→${raw.supersededBy}]`;
    try {
      const newPartId = await resolvePart(raw.manufacturer, raw.supersededBy);
      if (!newPartId) {
        result.warnings.push(`${label} remplacement absent du catalogue, ignoré`);
        continue;
      }
      if (newPartId === oldPartId) continue;
      await db
        .insert(supersessions)
        .values({ oldPartId, newPartId, source, note: "Remplacement officiel" })
        .onConflictDoNothing();
    } catch (err) {
      result.errors.push(`${label} ${String(err)}`);
    }
  }

  for (const raw of rawParts) {
    const partId = Array.isArray(raw?.compatibleWith) && raw.compatibleWith.length > 0
      ? partRegistry.get(partKey(raw.manufacturer, raw.reference))
      : undefined;
    if (!partId) continue;
    for (const compat of raw.compatibleWith ?? []) {
      const label = `[compat ${raw.manufacturer} ${raw.reference}→${compat}]`;
      const sep = typeof compat === "string" ? compat.indexOf("|") : -1;
      if (sep < 0) {
        result.warnings.push(`${label} format attendu "Fabricant|Référence", ignoré`);
        continue;
      }
      try {
        const compatPartId = await resolvePart(compat.slice(0, sep), compat.slice(sep + 1));
        if (!compatPartId) {
          result.warnings.push(`${label} pièce absente du catalogue, ignorée`);
          continue;
        }
        if (compatPartId === partId) continue;
        await db
          .insert(compatibilities)
          .values({ partId, compatiblePartId: compatPartId, confidence: 0.7, source })
          .onConflictDoNothing();
      } catch (err) {
        result.errors.push(`${label} ${String(err)}`);
      }
    }
  }

  return result;
}

function partKey(manufacturer: string, reference: string): string {
  return `${slugify(manufacturer)}|${normalizeReference(reference)}`;
}

async function ingestOne(
  raw: IngestPart,
  source: string,
  ids: LookupCache,
  warnings: string[],
): Promise<{ partId: number; inserted: boolean; offersWritten: number }> {
  const manufacturerId = await ids.manufacturer(raw);
  const categoryName = clean(raw.category);
  const categoryId = categoryName ? await ids.category(categoryName, raw.industry) : null;

  // Offres : vendeurs résolus hors transaction (idempotent), une offre par vendeur
  const offersBySeller = new Map<number, typeof offers.$inferInsert>();
  for (const offer of raw.offers ?? []) {
    const problem = offerProblem(offer);
    if (problem) {
      warnings.push(`[${raw.manufacturer} ${raw.reference}] offre ignorée : ${problem}`);
      continue;
    }
    const sellerId = await ids.seller(offer);
    offersBySeller.set(sellerId, {
      partId: 0, // renseigné après l'upsert de la pièce
      sellerId,
      price: offer.price != null ? offer.price.toFixed(2) : null,
      currency: clean(offer.currency)?.toUpperCase() ?? "EUR",
      availability: clean(offer.availability),
      url: offer.url,
    });
  }

  const xrefs = validCrossReferences(raw);

  return db.transaction(async (tx) => {
    const [upserted] = await tx
      .insert(parts)
      .values({
        manufacturerId,
        categoryId,
        referenceRaw: raw.reference.trim(),
        referenceNormalized: normalizeReference(raw.reference),
        slug: referenceSlug(raw.reference),
        name: raw.name.trim(),
        description: clean(raw.description),
        status: raw.status ?? "unknown",
        attributes: cleanRecord(raw.attributes),
        specs: cleanRecord(raw.specs) ?? {},
        productUrl: isHttpUrl(raw.productUrl) ? raw.productUrl : null,
        datasheetUrl: isHttpUrl(raw.datasheetUrl) ? raw.datasheetUrl : null,
        urlVerifiedAt: parseDate(raw.urlVerifiedAt),
        confidenceScore: typeof raw.confidenceScore === "number" && Number.isFinite(raw.confidenceScore)
          ? Math.round(raw.confidenceScore)
          : null,
      })
      .onConflictDoUpdate({
        target: [parts.manufacturerId, parts.referenceNormalized],
        set: {
          name: sql`excluded.name`,
          description: sql`COALESCE(excluded.description, ${parts.description})`,
          categoryId: sql`COALESCE(excluded.category_id, ${parts.categoryId})`,
          attributes: sql`COALESCE(excluded.attributes, ${parts.attributes})`,
          specs: sql`CASE WHEN excluded.specs IS NULL OR excluded.specs = '{}'::jsonb THEN ${parts.specs} ELSE excluded.specs END`,
          status: sql`CASE
            WHEN excluded.status = 'unknown' THEN ${parts.status}
            WHEN ${parts.lifecycleCheckedAt} IS NOT NULL AND NOT ${parts.needsReview} THEN ${parts.status}
            ELSE excluded.status
          END`,
          productUrl: sql`COALESCE(excluded.product_url, ${parts.productUrl})`,
          datasheetUrl: sql`COALESCE(excluded.datasheet_url, ${parts.datasheetUrl})`,
          urlVerifiedAt: sql`COALESCE(excluded.url_verified_at, ${parts.urlVerifiedAt})`,
          confidenceScore: sql`COALESCE(excluded.confidence_score, ${parts.confidenceScore})`,
          updatedAt: sql`now()`,
        },
      })
      .returning({
        id: parts.id,
        inserted: sql<boolean>`(xmax = 0)`,
      });

    const partId = upserted.id;

    if (xrefs.length > 0) {
      await tx
        .insert(partReferences)
        .values(
          xrefs.map((x) => ({
            partId,
            reference: x.reference.trim(),
            referenceNormalized: normalizeReference(x.reference),
            type: x.type,
            brand: clean(x.brand),
            source,
          })),
        )
        .onConflictDoNothing();
    }

    if (offersBySeller.size > 0) {
      await tx
        .insert(offers)
        .values([...offersBySeller.values()].map((o) => ({ ...o, partId })))
        .onConflictDoUpdate({
          target: [offers.partId, offers.sellerId],
          set: {
            // Une offre sans prix (lien seul) n'efface pas le dernier prix relevé
            price: sql`COALESCE(excluded.price, ${offers.price})`,
            currency: sql`CASE WHEN excluded.price IS NOT NULL THEN excluded.currency ELSE ${offers.currency} END`,
            availability: sql`COALESCE(excluded.availability, ${offers.availability})`,
            url: sql`excluded.url`,
            scrapedAt: sql`CASE WHEN excluded.price IS NOT NULL THEN now() ELSE ${offers.scrapedAt} END`,
          },
        });
    }

    return { partId, inserted: upserted.inserted, offersWritten: offersBySeller.size };
  });
}

/**
 * Identifiants des fabricants / catégories / vendeurs déjà résolus dans le
 * lot : évite un aller-retour SQL par pièce pour des valeurs qui se répètent.
 * Un upsert existant n'écrase ni nom ni type ; il complète seulement les
 * champs vides (site web, pays).
 */
class LookupCache {
  private manufacturers = new Map<string, number>();
  private categories = new Map<string, number>();
  private sellers = new Map<string, number>();

  async manufacturer(raw: IngestPart): Promise<number> {
    const slug = slugify(raw.manufacturer);
    const cached = this.manufacturers.get(slug);
    if (cached) return cached;
    const [row] = await db
      .insert(manufacturers)
      .values({
        name: raw.manufacturer.trim(),
        slug,
        industry: raw.industry,
        website: isHttpUrl(raw.manufacturerWebsite) ? raw.manufacturerWebsite : null,
      })
      .onConflictDoUpdate({
        target: manufacturers.slug,
        set: { website: sql`COALESCE(${manufacturers.website}, excluded.website)` },
      })
      .returning({ id: manufacturers.id });
    this.manufacturers.set(slug, row.id);
    return row.id;
  }

  async category(name: string, industry: IngestPart["industry"]): Promise<number | null> {
    const slug = slugify(name);
    if (!slug) return null;
    const cached = this.categories.get(slug);
    if (cached) return cached;
    const [row] = await db
      .insert(categories)
      .values({ name, slug, industry })
      .onConflictDoUpdate({
        target: categories.slug,
        // Affectation neutre : nécessaire pour que RETURNING renvoie la ligne existante
        set: { name: sql`${categories.name}` },
      })
      .returning({ id: categories.id });
    this.categories.set(slug, row.id);
    return row.id;
  }

  async seller(offer: IngestOffer): Promise<number> {
    const slug = slugify(offer.sellerName);
    const cached = this.sellers.get(slug);
    if (cached) return cached;
    const [row] = await db
      .insert(sellers)
      .values({
        name: offer.sellerName.trim(),
        slug,
        type: offer.sellerType,
        website: isHttpUrl(offer.sellerWebsite) ? offer.sellerWebsite : null,
        country: clean(offer.sellerCountry),
      })
      .onConflictDoUpdate({
        target: sellers.slug,
        set: {
          website: sql`COALESCE(${sellers.website}, excluded.website)`,
          country: sql`COALESCE(${sellers.country}, excluded.country)`,
        },
      })
      .returning({ id: sellers.id });
    this.sellers.set(slug, row.id);
    return row.id;
  }
}
