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

    return [
      { url: siteUrl, changeFrequency: "daily" as const, priority: 1 },
      ...manufacturers.map((m) => ({
        url: `${siteUrl}/marque/${m.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...categories.map((c) => ({
        url: `${siteUrl}/categorie/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...partPaths.map((p) => ({
        url: `${siteUrl}/piece/${p.manufacturerSlug}/${p.partSlug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Base indisponible (build, CI) : sitemap minimal plutôt qu'une erreur.
    return [{ url: siteUrl, priority: 1 }];
  }
}
