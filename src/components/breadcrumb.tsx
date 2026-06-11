import Link from "next/link";
import { siteUrl } from "@/lib/site-url";

export type BreadcrumbItem = { label: string; href: string };

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const allItems = [{ label: "Accueil", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${siteUrl}${item.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Fil d'Ariane" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-zinc-500">
        {allItems.map((item, index) => (
          <span key={item.href} className="flex items-center gap-1">
            {index > 0 && <span className="text-zinc-300">/</span>}
            {index < allItems.length - 1 ? (
              <Link href={item.href} className="hover:text-zinc-900 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-zinc-700 font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
