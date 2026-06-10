import type { Metadata } from "next";
import Link from "next/link";
import { getAllManufacturers } from "@/lib/queries";

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
  const manufacturers = await getAllManufacturers();

  const byIndustry = new Map<string, typeof manufacturers>();
  for (const m of manufacturers) {
    const list = byIndustry.get(m.industry) ?? [];
    list.push(m);
    byIndustry.set(m.industry, list);
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
            {brands.map((m) => (
              <Link
                key={m.id}
                href={`/marque/${m.slug}`}
                className="rounded-xl border border-zinc-200 p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="font-semibold text-zinc-900">{m.name}</div>
                <div className="mt-1 text-sm text-zinc-500">
                  Pièces détachées {m.name} →
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
