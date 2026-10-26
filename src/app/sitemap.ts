import type { MetadataRoute } from "next";
import {
  getAllPartPaths,
  getCategoriesWithCounts,
  getManufacturersWithCounts,
} from "@/lib/queries";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Sitemap dynamique. Au-delà de ~50 000 URLs il faudra passer à un index de
 * sitemaps shardés (générés hors-ligne et servis statiquement).
 *
 * lastModified n'est renseigné que lorsqu'il est réel (date de mise à jour de
 * la pièce) : une date « maintenant » sur chaque URL pousse Google à ignorer
 * le champ. Les hubs marque/catégorie vides sont exclus (pages sans contenu).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [partPaths, manufacturers, categories] = await Promise.all([
      getAllPartPaths(),
      getManufacturersWithCounts(),
      getCategoriesWithCounts(),
    ]);

    const staticPages: MetadataRoute.Sitemap = [
      { url: siteUrl, changeFrequency: "weekly", priority: 1 },
      { url: `${siteUrl}/marques`, changeFrequency: "monthly", priority: 0.7 },
      { url: `${siteUrl}/categories`, changeFrequency: "monthly", priority: 0.7 },
      { url: `${siteUrl}/vendeurs`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${siteUrl}/recent`, changeFrequency: "daily", priority: 0.6 },
    ];

    return [
      ...staticPages,
      ...manufacturers
        .filter((m) => m.partsCount > 0)
        .map(({ manufacturer }) => ({
          url: `${siteUrl}/marque/${manufacturer.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ...categories
        .filter((c) => c.partsCount > 0)
        .map(({ category }) => ({
          url: `${siteUrl}/categorie/${category.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        })),
      ...partPaths.map((p) => ({
        url: `${siteUrl}/piece/${p.manufacturerSlug}/${p.partSlug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        lastModified: p.updatedAt,
      })),
    ];
  } catch {
    // Base indisponible (build, CI) : sitemap minimal plutôt qu'une erreur.
    return [{ url: siteUrl, priority: 1 }];
  }
}
