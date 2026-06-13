import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/recherche",
          "/api/",
          "/admin/",
          "/comparer",
          "/technicien",
          "/liste/partage",
          "/piece/*/print",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
