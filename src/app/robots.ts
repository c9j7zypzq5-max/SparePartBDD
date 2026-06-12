import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/recherche", "/api/", "/go", "/admin", "/developers/usage"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
