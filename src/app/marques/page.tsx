import type { Metadata } from "next";
import Link from "next/link";
import { getManufacturersWithCounts } from "@/lib/queries";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Toutes les marques",
  description:
    "Parcourez les pièces détachées par fabricant : Siemens, Schneider Electric, ABB, Rockwell, Cisco, Dell, HPE, Lenovo…",
  alternates: { canonical: "/marques" },
};

const INDUSTRY_LABELS: Record<string, string> = {
  industrie: "Industrie",
  informatique: "Informatique",
  automobile: "Automobile",
  electromenager: "Électroménager",
  hvac: "HVAC",
  electronique: "Électronique",
};

export default async function BrandsPage() {
  const rows = await getManufacturersWithCounts();

  const byIndustry = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byIndustry.get(row.manufacturer.industry) ?? [];
    list.push(row);
    byIndustry.set(row.manufacturer.industry, list);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Toutes les marques</h1>
      <p className="mt-2 text-zinc-500">
        Parcourez le catalogue par fabricant.
      </p>
      {[...byIndustry.entries()].map(([industry, brands]) => (
        <section key={industry} className="mt-8">
          <h2 className="text-xl font-semibold">
            {INDUSTRY_LABELS[industry] ?? industry}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map(({ manufacturer: m, partsCount }) => (
              <Link
                key={m.id}
                href={`/marque/${m.slug}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <BrandLogo slug={m.slug} name={m.name} size={40} />
                <div>
                  <div className="font-semibold text-zinc-900">{m.name}</div>
                  <div className="mt-1 text-sm text-zinc-500">
                    {partsCount} pièce{partsCount > 1 ? "s" : ""} référencée
                    {partsCount > 1 ? "s" : ""} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
