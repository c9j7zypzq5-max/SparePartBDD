import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

const {
  categories,
  compatibilities,
  manufacturers,
  offers,
  partReferences,
  parts,
  sellers,
  supersessions,
} = schema;

export type PartDetail = NonNullable<Awaited<ReturnType<typeof getPartDetail>>>;

/** Charge tout ce qu'affiche une page pièce : la donnée cœur du produit. */
export async function getPartDetail(manufacturerSlug: string, partSlug: string) {
  const [row] = await db
    .select({
      part: parts,
      manufacturer: manufacturers,
      category: categories,
    })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .leftJoin(categories, eq(categories.id, parts.categoryId))
    .where(
      and(eq(manufacturers.slug, manufacturerSlug), eq(parts.slug, partSlug)),
    )
    .limit(1);

  if (!row) return null;

  const partId = row.part.id;

  const [references, replacements, replacedBy, compatibleLinks, offerRows] =
    await Promise.all([
      db
        .select()
        .from(partReferences)
        .where(eq(partReferences.partId, partId)),
      // Pièces que celle-ci remplace (historique)
      db
        .select({ supersession: supersessions, part: parts, manufacturer: manufacturers })
        .from(supersessions)
        .innerJoin(parts, eq(parts.id, supersessions.oldPartId))
        .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
        .where(eq(supersessions.newPartId, partId)),
      // Pièce(s) qui remplacent celle-ci (la réponse clé si obsolète)
      db
        .select({ supersession: supersessions, part: parts, manufacturer: manufacturers })
        .from(supersessions)
        .innerJoin(parts, eq(parts.id, supersessions.newPartId))
        .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
        .where(eq(supersessions.oldPartId, partId)),
      db
        .select({ compatibility: compatibilities, part: parts, manufacturer: manufacturers })
        .from(compatibilities)
        .innerJoin(parts, eq(parts.id, compatibilities.compatiblePartId))
        .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
        .where(eq(compatibilities.partId, partId)),
      db
        .select({ offer: offers, seller: sellers })
        .from(offers)
        .innerJoin(sellers, eq(sellers.id, offers.sellerId))
        .where(eq(offers.partId, partId))
        .orderBy(asc(offers.price)),
    ]);

  return {
    ...row,
    references,
    replacedBy,
    replacements,
    compatibles: compatibleLinks,
    offers: offerRows,
  };
}

export async function getManufacturerWithParts(slug: string) {
  const [manufacturer] = await db
    .select()
    .from(manufacturers)
    .where(eq(manufacturers.slug, slug))
    .limit(1);
  if (!manufacturer) return null;

  const partRows = await db
    .select()
    .from(parts)
    .where(eq(parts.manufacturerId, manufacturer.id))
    .orderBy(asc(parts.referenceNormalized));

  return { manufacturer, parts: partRows };
}

export async function getCategoryWithParts(slug: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (!category) return null;

  const partRows = await db
    .select({ part: parts, manufacturer: manufacturers })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .where(eq(parts.categoryId, category.id))
    .orderBy(asc(parts.name));

  return { category, parts: partRows };
}

export async function getAllManufacturers() {
  return db.select().from(manufacturers).orderBy(asc(manufacturers.name));
}

export async function getAllCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

/** Pour le sitemap : toutes les URLs de pages pièce. */
export async function getAllPartPaths() {
  const rows = await db
    .select({ partSlug: parts.slug, manufacturerId: parts.manufacturerId })
    .from(parts);
  const manufacturerIds = [...new Set(rows.map((r) => r.manufacturerId))];
  if (manufacturerIds.length === 0) return [];
  const mans = await db
    .select({ id: manufacturers.id, slug: manufacturers.slug })
    .from(manufacturers)
    .where(inArray(manufacturers.id, manufacturerIds));
  const slugById = new Map(mans.map((m) => [m.id, m.slug]));
  return rows.map((r) => ({
    manufacturerSlug: slugById.get(r.manufacturerId)!,
    partSlug: r.partSlug,
  }));
}
