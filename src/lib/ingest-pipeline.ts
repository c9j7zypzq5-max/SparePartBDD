import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeReference, referenceSlug, slugify } from "@/lib/normalize";
import type { IngestPart, IngestResult } from "@/lib/ingest-types";

/**
 * Ingère un lot de pièces dans la base. Chaque pièce est upsertée :
 * mise à jour si (fabricant + référence normalisée) existe déjà, insérée sinon.
 * Les erreurs par pièce sont collectées sans interrompre le reste du lot.
 *
 * L'appel se fait en deux passes : d'abord tous les objets (fabricants,
 * catégories, pièces, cross-refs, offres), puis les relations entre pièces
 * (supersessions, compatibilités) qui nécessitent que les deux pièces existent.
 */
export async function ingestParts(
  parts: IngestPart[],
  source: string,
): Promise<IngestResult> {
  const result: IngestResult = {
    partsInserted: 0,
    partsUpdated: 0,
    offersInserted: 0,
    errors: [],
  };

  // "manufacturerSlug|referenceNormalized" → partId — sert à résoudre les
  // supersessions et compatibilités en deuxième passe
  const partRegistry = new Map<string, number>();

  // ── Passe 1 : pièces, cross-refs, offres ─────────────────────────────────

  for (const raw of parts) {
    try {
      // 1a. Fabricant
      const manufacturerSlug = slugify(raw.manufacturer);
      const [manufacturer] = await db
        .insert(schema.manufacturers)
        .values({
          name: raw.manufacturer,
          slug: manufacturerSlug,
          industry: raw.industry,
          website: raw.manufacturerWebsite,
        })
        .onConflictDoUpdate({
          target: schema.manufacturers.slug,
          set: { name: raw.manufacturer, industry: raw.industry },
        })
        .returning({ id: schema.manufacturers.id });

      // 1b. Catégorie (optionnelle)
      let categoryId: number | undefined;
      if (raw.category) {
        const categorySlug = slugify(raw.category);
        const [category] = await db
          .insert(schema.categories)
          .values({
            name: raw.category,
            slug: categorySlug,
            industry: raw.industry,
          })
          .onConflictDoUpdate({
            target: schema.categories.slug,
            set: { name: raw.category },
          })
          .returning({ id: schema.categories.id });
        categoryId = category.id;
      }

      // 1c. Pièce (upsert par manufacturerId + referenceNormalized)
      const refNorm = normalizeReference(raw.reference);
      const partSlug = referenceSlug(raw.reference);

      const existing = await db
        .select({ id: schema.parts.id })
        .from(schema.parts)
        .where(
          and(
            eq(schema.parts.manufacturerId, manufacturer.id),
            eq(schema.parts.referenceNormalized, refNorm),
          ),
        )
        .limit(1);

      let partId: number;
      if (existing.length > 0) {
        partId = existing[0].id;
        await db
          .update(schema.parts)
          .set({
            name: raw.name,
            description: raw.description ?? null,
            status: raw.status ?? "unknown",
            categoryId: categoryId ?? null,
            attributes: raw.attributes ?? null,
            // Ne jamais effacer une URL existante si le batch ne la fournit pas
            ...(raw.productUrl ? { productUrl: raw.productUrl } : {}),
            ...(raw.datasheetUrl ? { datasheetUrl: raw.datasheetUrl } : {}),
            ...(raw.urlVerifiedAt ? { urlVerifiedAt: new Date(raw.urlVerifiedAt) } : {}),
            ...(raw.confidenceScore != null ? { confidenceScore: raw.confidenceScore } : {}),
            updatedAt: new Date(),
          })
          .where(eq(schema.parts.id, partId));
        result.partsUpdated++;
      } else {
        const [inserted] = await db
          .insert(schema.parts)
          .values({
            manufacturerId: manufacturer.id,
            categoryId: categoryId ?? null,
            referenceRaw: raw.reference,
            referenceNormalized: refNorm,
            slug: partSlug,
            name: raw.name,
            description: raw.description,
            status: raw.status ?? "unknown",
            attributes: raw.attributes,
            productUrl: raw.productUrl,
            datasheetUrl: raw.datasheetUrl,
            urlVerifiedAt: raw.urlVerifiedAt ? new Date(raw.urlVerifiedAt) : undefined,
            confidenceScore: raw.confidenceScore,
          })
          .returning({ id: schema.parts.id });
        partId = inserted.id;
        result.partsInserted++;
      }

      partRegistry.set(`${manufacturerSlug}|${refNorm}`, partId);

      // 1d. Cross-références
      for (const xref of raw.crossReferences ?? []) {
        await db
          .insert(schema.partReferences)
          .values({
            partId,
            reference: xref.reference,
            referenceNormalized: normalizeReference(xref.reference),
            type: xref.type,
            brand: xref.brand,
            source,
          })
          .onConflictDoNothing();
      }

      // 1e. Offres
      for (const offer of raw.offers ?? []) {
        const sellerSlug = slugify(offer.sellerName);
        const [seller] = await db
          .insert(schema.sellers)
          .values({
            name: offer.sellerName,
            slug: sellerSlug,
            type: offer.sellerType,
            website: offer.sellerWebsite,
            country: offer.sellerCountry,
          })
          .onConflictDoUpdate({
            target: schema.sellers.slug,
            set: { type: offer.sellerType },
          })
          .returning({ id: schema.sellers.id });

        const offerPrice = offer.price != null ? String(offer.price.toFixed(2)) : null;
        await db
          .insert(schema.offers)
          .values({
            partId,
            sellerId: seller.id,
            price: offerPrice,
            currency: offer.currency ?? "EUR",
            availability: offer.availability,
            url: offer.url,
          })
          .onConflictDoUpdate({
            target: [schema.offers.partId, schema.offers.sellerId],
            set: {
              price: offerPrice,
              currency: offer.currency ?? "EUR",
              availability: offer.availability,
              url: offer.url,
              scrapedAt: new Date(),
            },
          });
        result.offersInserted++;
      }
    } catch (err) {
      result.errors.push(
        `[${raw.manufacturer} ${raw.reference}] ${String(err)}`,
      );
    }
  }

  // ── Passe 2 : supersessions et compatibilités ─────────────────────────────

  for (const raw of parts) {
    if (!raw.supersededBy) continue;
    try {
      const oldKey = `${slugify(raw.manufacturer)}|${normalizeReference(raw.reference)}`;
      const newKey = `${slugify(raw.manufacturer)}|${normalizeReference(raw.supersededBy)}`;
      const oldPartId = partRegistry.get(oldKey);
      const newPartId = partRegistry.get(newKey);
      if (!oldPartId || !newPartId) continue;

      await db
        .insert(schema.supersessions)
        .values({ oldPartId, newPartId, source, note: "Remplacement officiel" })
        .onConflictDoNothing();
    } catch (err) {
      result.errors.push(
        `[supersession ${raw.manufacturer} ${raw.reference}→${raw.supersededBy}] ${String(err)}`,
      );
    }
  }

  for (const raw of parts) {
    if (!raw.compatibleWith?.length) continue;
    const srcKey = `${slugify(raw.manufacturer)}|${normalizeReference(raw.reference)}`;
    const partId = partRegistry.get(srcKey);
    if (!partId) continue;

    for (const compat of raw.compatibleWith) {
      try {
        const sep = compat.indexOf("|");
        if (sep < 0) continue;
        const compatManufacturer = compat.slice(0, sep);
        const compatRef = compat.slice(sep + 1);
        const compatKey = `${slugify(compatManufacturer)}|${normalizeReference(compatRef)}`;
        const compatPartId = partRegistry.get(compatKey);
        if (!compatPartId) continue;

        await db
          .insert(schema.compatibilities)
          .values({ partId, compatiblePartId: compatPartId, confidence: 0.7, source })
          .onConflictDoNothing();
      } catch (err) {
        result.errors.push(
          `[compat ${raw.manufacturer} ${raw.reference}→${compat}] ${String(err)}`,
        );
      }
    }
  }

  return result;
}
