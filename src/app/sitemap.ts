import type { MetadataRoute } from "next";
import {
  getAllCategories,
  getAllManufacturers,
  getAllPartPaths,
} from "@/lib/queries";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Sitemap dynamique. Au-delà de ~50 000 URLs il faudra passer à un index de
 * sitemaps shardés (générés hors-ligne et servis statiquement).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [partPaths, manufacturers, categories] = await Promise.all([
      getAllPartPaths(),
      getAllManufacturers(),
      getAllCategories(),
    ]);

    const now = new Date();

    const staticPages: MetadataRoute.Sitemap = [
      { url: siteUrl, changeFrequency: "weekly", priority: 1, lastModified: now },
      { url: `${siteUrl}/marques`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
      { url: `${siteUrl}/categories`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
      { url: `${siteUrl}/vendeurs`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
      { url: `${siteUrl}/recent`, changeFrequency: "daily", priority: 0.6, lastModified: now },
    ];

    return [
      ...staticPages,
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
      ...partPaths.map((p) => ({
        url: `${siteUrl}/piece/${p.manufacturerSlug}/${p.partSlug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        lastModified: now,
      })),
    ];
  } catch {
    // Base indisponible (build, CI) : sitemap minimal plutôt qu'une erreur.
    return [{ url: siteUrl, priority: 1 }];
  }
}
