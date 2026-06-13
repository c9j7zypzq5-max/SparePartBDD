import type { Metadata } from "next";
import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeReference } from "@/lib/normalize";
import { PartCard } from "@/components/part-card";

const { parts, manufacturers } = schema;

export const metadata: Metadata = {
  title: "Liste partagée",
  robots: { index: false },
};

type Search = Promise<{ refs?: string }>;

export default async function PartageListePage({ searchParams }: { searchParams: Search }) {
  const { refs: refsParam } = await searchParams;
  const rawRefs = refsParam
    ? refsParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .slice(0, 50)
    : [];

  if (rawRefs.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
        <p className="text-lg font-medium text-zinc-700">Aucune référence dans ce lien</p>
        <p className="mt-2 text-sm text-zinc-500">
          Ce lien de partage ne contient pas de références valides.
        </p>
        <Link
          href="/recherche"
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Rechercher des pièces
        </Link>
      </div>
    );
  }

  const normalized = rawRefs.map(normalizeReference);
  const rows = await db
    .select({ part: parts, manufacturer: manufacturers })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .where(inArray(parts.referenceNormalized, normalized));

  const rowMap = new Map(rows.map((r) => [r.part.referenceNormalized, r]));
  const found = rawRefs.map((raw) => rowMap.get(normalizeReference(raw)));
  const foundCount = found.filter(Boolean).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Liste partagée</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {foundCount} référence{foundCount > 1 ? "s" : ""} sur {rawRefs.length} trouvée
          {foundCount > 1 ? "s" : ""} dans notre catalogue.
        </p>
      </div>

      <div className="grid gap-3">
        {rawRefs.map((raw, i) => {
          const row = found[i];
          if (!row) {
            return (
              <div
                key={raw}
                className="rounded-xl border border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-400"
              >
                <span className="font-mono">{raw}</span>
                <span className="ml-3 text-xs">— introuvable dans le catalogue</span>
              </div>
            );
          }
          return (
            <PartCard
              key={raw}
              href={`/piece/${row.manufacturer.slug}/${row.part.slug}`}
              name={row.part.name}
              referenceRaw={row.part.referenceRaw}
              manufacturerName={row.manufacturer.name}
              manufacturerSlug={row.manufacturer.slug}
              status={row.part.status}
            />
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-medium text-blue-900">
          Ajoutez ces références à votre propre liste de suivi
        </p>
        <p className="mt-1 text-sm text-blue-700">
          Rendez-vous sur chaque fiche produit pour ajouter les références qui vous intéressent.
        </p>
        <Link
          href="/recherche"
          className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Rechercher des pièces
        </Link>
      </div>
    </div>
  );
}
