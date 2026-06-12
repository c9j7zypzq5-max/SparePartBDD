import type { MetadataRoute } from "next";
import {
  getAllCategories,
  getAllManufacturers,
  getPartCount,
  getPartPathsPaginated,
} from "@/lib/queries";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Sitemap shardé. Next.js sert un index à /sitemap.xml et chaque tranche à
 * /sitemap/<id>.xml. Le shard 0 contient les pages statiques + hubs (marques,
 * catégories) ; les shards 1..N contiennent les pages pièce par tranches de
 * SHARD_SIZE, ce qui garde chaque fichier sous la limite de 50 000 URLs.
 */
const SHARD_SIZE = 10_000;

export async function generateSitemaps(): Promise<{ id: number }[]> {
  try {
    const partCount = await getPartCount();
    const partShards = Math.max(0, Math.ceil(partCount / SHARD_SIZE));
    // id 0 = pages statiques + hubs ; id 1..partShards = pages pièce
    return Array.from({ length: partShards + 1 }, (_, i) => ({ id: i }));
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Shard 0 : pages statiques + hubs marques/catégories
  if (id === 0) {
    try {
      const [manufacturers, categories] = await Promise.all([
        getAllManufacturers(),
        getAllCategories(),
      ]);
      return [
        { url: siteUrl, changeFrequency: "weekly", priority: 1, lastModified: now },
        { url: `${siteUrl}/marques`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
        { url: `${siteUrl}/categories`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
        { url: `${siteUrl}/developers`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
        { url: `${siteUrl}/recherche`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
        { url: `${siteUrl}/liste`, changeFrequency: "monthly", priority: 0.4, lastModified: now },
        ...manufacturers.map((m) => ({
          url: `${siteUrl}/marque/${m.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.7,
          lastModified: now,
        })),
        ...categories.map((c) => ({
          url: `${siteUrl}/categorie/${c.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.6,
          lastModified: now,
        })),
      ];
    } catch {
      return [{ url: siteUrl, priority: 1 }];
    }
  }

  // Shards 1..N : pages pièce paginées
  try {
    const paths = await getPartPathsPaginated((id - 1) * SHARD_SIZE, SHARD_SIZE);
    return paths.map((p) => ({
      url: `${siteUrl}/piece/${p.manufacturerSlug}/${p.partSlug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified: p.updatedAt ?? now,
    }));
  } catch {
    return [];
  }
}
