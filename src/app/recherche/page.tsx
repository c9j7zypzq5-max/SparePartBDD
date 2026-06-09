import type { Metadata } from "next";
import { SearchBar } from "@/components/search-bar";
import { PartCard } from "@/components/part-card";
import { searchService } from "@/lib/search/postgres-search";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
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
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const hits = query ? await searchService.search(query) : [];

  return (
    <div>
      <SearchBar defaultValue={query} />
      {query && (
        <p className="mt-6 text-sm text-zinc-500">
          {hits.length} résultat{hits.length > 1 ? "s" : ""} pour «{" "}
          <span className="font-medium text-zinc-900">{query}</span> »
        </p>
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
        <p className="mt-8 text-zinc-500">
          Aucune pièce trouvée. Essayez avec la référence complète, sans
          espaces ni tirets.
        </p>
      )}
    </div>
  );
}
