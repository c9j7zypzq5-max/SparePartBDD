import { aliasedTable, and, asc, desc, eq, inArray, sql } from "drizzle-orm";
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

export async function getManufacturerBySlug(slug: string) {
  const [manufacturer] = await db
    .select()
    .from(manufacturers)
    .where(eq(manufacturers.slug, slug))
    .limit(1);
  return manufacturer ?? null;
}

export async function getManufacturerPageData(
  slug: string,
  limit: number,
  opts: { status?: string; sort?: string } = {},
) {
  const [manufacturer] = await db
    .select()
    .from(manufacturers)
    .where(eq(manufacturers.slug, slug))
    .limit(1);
  if (!manufacturer) return null;

  const statusCondition =
    opts.status === "active" || opts.status === "obsolete"
      ? eq(parts.status, opts.status)
      : undefined;

  const order = opts.sort === "name_desc"
    ? desc(parts.referenceNormalized)
    : asc(parts.referenceNormalized);

  const [[countRow], [obsoleteRow], partRows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(parts)
      .where(
        statusCondition
          ? and(eq(parts.manufacturerId, manufacturer.id), statusCondition)
          : eq(parts.manufacturerId, manufacturer.id),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(parts)
      .where(and(eq(parts.manufacturerId, manufacturer.id), eq(parts.status, "obsolete"))),
    db
      .select()
      .from(parts)
      .where(
        statusCondition
          ? and(eq(parts.manufacturerId, manufacturer.id), statusCondition)
          : eq(parts.manufacturerId, manufacturer.id),
      )
      .orderBy(order)
      .limit(limit),
  ]);

  return {
    manufacturer,
    parts: partRows,
    totalCount: countRow.total,
    obsoleteCount: obsoleteRow.count,
  };
}

export async function getManufacturerPartsPaginated(
  manufacturerId: number,
  limit: number,
  offset: number,
) {
  return db
    .select()
    .from(parts)
    .where(eq(parts.manufacturerId, manufacturerId))
    .orderBy(asc(parts.referenceNormalized))
    .limit(limit)
    .offset(offset);
}

export async function getManufacturerPartsPaginatedFiltered(
  manufacturerId: number,
  limit: number,
  offset: number,
  opts: { status?: string; sort?: string } = {},
) {
  const conditions: ReturnType<typeof eq>[] = [eq(parts.manufacturerId, manufacturerId)];
  if (opts.status === "active" || opts.status === "obsolete") {
    conditions.push(eq(parts.status, opts.status));
  }

  const order = opts.sort === "name_desc"
    ? desc(parts.referenceNormalized)
    : asc(parts.referenceNormalized);

  return db
    .select()
    .from(parts)
    .where(and(...conditions))
    .orderBy(order)
    .limit(limit)
    .offset(offset);
}

export async function getCategoryBySlug(slug: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return category ?? null;
}

export async function getCategoryPageData(slug: string, limit: number) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (!category) return null;

  const [[countRow], partRows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(parts)
      .where(eq(parts.categoryId, category.id)),
    db
      .select({ part: parts, manufacturer: manufacturers })
      .from(parts)
      .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
      .where(eq(parts.categoryId, category.id))
      .orderBy(asc(parts.referenceNormalized))
      .limit(limit),
  ]);

  return { category, parts: partRows, totalCount: countRow.total };
}

export async function getCategoryPartsPaginated(
  categoryId: number,
  limit: number,
  offset: number,
) {
  return db
    .select({ part: parts, manufacturer: manufacturers })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .where(eq(parts.categoryId, categoryId))
    .orderBy(asc(parts.referenceNormalized))
    .limit(limit)
    .offset(offset);
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

/** Fabricants avec leurs compteurs de pièces, pour /marques et la home. */
export async function getManufacturersWithCounts() {
  return db
    .select({
      manufacturer: manufacturers,
      partsCount: sql<number>`count(${parts.id})::int`,
      obsoleteCount: sql<number>`count(*) FILTER (WHERE ${parts.status} = 'obsolete')::int`,
    })
    .from(manufacturers)
    .leftJoin(parts, eq(parts.manufacturerId, manufacturers.id))
    .groupBy(manufacturers.id)
    .orderBy(asc(manufacturers.name));
}

export async function getAllCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

/** Catégories avec leur nombre de pièces, pour la page /categories. */
export async function getCategoriesWithCounts() {
  return db
    .select({
      category: categories,
      partsCount: sql<number>`count(${parts.id})::int`,
    })
    .from(categories)
    .leftJoin(parts, eq(parts.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
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

/** Statistiques affichées sur la home. */
export async function getHomeStats() {
  const [stats] = await db
    .select({
      partsCount: sql<number>`(SELECT count(*) FROM parts)`,
      manufacturersCount: sql<number>`(SELECT count(*) FROM manufacturers)`,
      offersCount: sql<number>`(SELECT count(*) FROM offers)`,
      obsoleteCount: sql<number>`(SELECT count(*) FROM parts WHERE status = 'obsolete')`,
    })
    .from(sql`(SELECT 1) AS one`);
  return stats;
}

/** Pièces obsolètes avec leur remplacement officiel, pour la home. */
export async function getRecentSupersessions(limit = 4) {
  const oldParts = aliasedTable(parts, "old_parts");
  const oldManufacturers = aliasedTable(manufacturers, "old_manufacturers");
  return db
    .select({
      oldPart: oldParts,
      oldManufacturer: oldManufacturers,
      newPart: parts,
      newManufacturer: manufacturers,
    })
    .from(supersessions)
    .innerJoin(oldParts, eq(oldParts.id, supersessions.oldPartId))
    .innerJoin(oldManufacturers, eq(oldManufacturers.id, oldParts.manufacturerId))
    .innerJoin(parts, eq(parts.id, supersessions.newPartId))
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .limit(limit);
}
