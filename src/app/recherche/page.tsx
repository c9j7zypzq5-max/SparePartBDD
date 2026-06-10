import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { PartCard } from "@/components/part-card";
import { searchService } from "@/lib/search/postgres-search";

export const dynamic = "force-dynamic";

type Search = Promise<{ q?: string; industrie?: string }>;

const FILTERS = [
  { value: "", label: "Tous" },
  { value: "industrie", label: "Industrie" },
  { value: "informatique", label: "Informatique" },
];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Search;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Résultats pour « ${q} »` : "Recherche",
    robots: { index: false }, // les pages de résultats ne doivent pas être indexées
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { q, industrie } = await searchParams;
  const query = q?.trim() ?? "";
  const industry = FILTERS.some((f) => f.value === industrie) ? industrie : undefined;
  const hits = query
    ? await searchService.search(query, { industry: industry || undefined })
    : [];

  return (
    <div>
      <SearchBar defaultValue={query} />

      {query && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = (industry ?? "") === f.value;
            const href = `/recherche?q=${encodeURIComponent(query)}${f.value ? `&industrie=${f.value}` : ""}`;
            return (
              <Link
                key={f.value}
                href={href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
          <span className="ml-auto text-sm text-zinc-500">
            {hits.length} résultat{hits.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="mt-4 grid gap-3">
        {hits.map((hit) => (
          <PartCard
            key={hit.partId}
            href={`/piece/${hit.manufacturerSlug}/${hit.slug}`}
            name={hit.name}
            referenceRaw={hit.referenceRaw}
            manufacturerName={hit.manufacturerName}
            status={hit.status}
            industry={hit.industry}
          />
        ))}
      </div>

      {query && hits.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
          <p className="font-medium text-zinc-700">Aucune pièce trouvée</p>
          <p className="mt-1 text-sm text-zinc-500">
            Essayez avec la référence complète, sans espaces ni tirets, ou
            élargissez le filtre d&apos;industrie.
          </p>
        </div>
      )}
    </div>
  );
}
