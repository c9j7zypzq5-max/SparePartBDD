import type { Metadata } from "next";
import Link from "next/link";
import { getCategoriesWithCounts } from "@/lib/queries";

// ISR : liste des catégories rafraîchie toutes les heures depuis le cache Edge
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Toutes les catégories",
  description:
    "Parcourez les pièces détachées par catégorie : automates, variateurs, contacteurs, alimentations serveur, modules SFP, contrôleurs RAID…",
  alternates: { canonical: "/categories" },
};

const INDUSTRY_LABELS: Record<string, string> = {
  industrie: "Industrie",
  informatique: "Informatique",
  automobile: "Automobile",
  electromenager: "Électroménager",
  hvac: "HVAC",
  electronique: "Électronique",
};

export default async function CategoriesPage() {
  // Base indisponible (ex : build sans BDD) : page vide servie, le prochain
  // cycle de revalidation ISR la régénère avec les données.
  let rawRows: Awaited<ReturnType<typeof getCategoriesWithCounts>> = [];
  try {
    rawRows = await getCategoriesWithCounts();
  } catch {}
  const rows = [...rawRows].sort((a, b) => b.partsCount - a.partsCount);

  const byIndustry = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byIndustry.get(row.category.industry) ?? [];
    list.push(row);
    byIndustry.set(row.category.industry, list);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Toutes les catégories
      </h1>
      <p className="mt-2 text-zinc-500">
        Parcourez le catalogue par famille de pièces.
      </p>
      {[...byIndustry.entries()].map(([industry, cats]) => (
        <section key={industry} className="mt-8">
          <h2 className="text-xl font-semibold">
            {INDUSTRY_LABELS[industry] ?? industry}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map(({ category, partsCount }) => (
              <Link
                key={category.id}
                href={`/categorie/${category.slug}`}
                className="rounded-xl border border-zinc-200 p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="font-semibold text-zinc-900">
                  {category.name}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  {partsCount} pièce{partsCount > 1 ? "s" : ""} référencée
                  {partsCount > 1 ? "s" : ""} →
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
