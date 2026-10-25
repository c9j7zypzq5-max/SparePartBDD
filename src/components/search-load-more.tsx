"use client";

import { useState, useTransition } from "react";
import { PartCard } from "@/components/part-card";
import type { SearchResult } from "@/lib/search/search-results";

const PAGE_SIZE = 20;

export function SearchLoadMore({
  initialHasMore,
  initialOffset,
  searchQuery,
}: {
  initialHasMore: boolean;
  /** Nombre de résultats déjà affichés par la page serveur (tient compte de ?page=N). */
  initialOffset: number;
  searchQuery: string;
}) {
  const [extraHits, setExtraHits] = useState<SearchResult[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const offset = initialOffset + extraHits.length;

  function loadMore() {
    startTransition(async () => {
      setError(false);
      const params = new URLSearchParams(searchQuery);
      params.set("offset", String(offset));
      params.delete("page");
      try {
        const res = await fetch(`/api/recherche?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const hits: SearchResult[] = await res.json();
        const newHits = hits.slice(0, PAGE_SIZE);
        setExtraHits((prev) => {
          const seen = new Set(prev.map((h) => h.partId));
          return [...prev, ...newHits.filter((h) => !seen.has(h.partId))];
        });
        setHasMore(hits.length > PAGE_SIZE);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <>
      {extraHits.length > 0 && (
        <div className="mt-3 grid gap-3">
          {extraHits.map((hit) => (
            <PartCard
              key={`${hit.manufacturerSlug}-${hit.slug}-${hit.partId}`}
              href={`/piece/${hit.manufacturerSlug}/${hit.slug}`}
              name={hit.name}
              referenceRaw={hit.referenceRaw}
              manufacturerName={hit.manufacturerName}
              manufacturerSlug={hit.manufacturerSlug}
              status={hit.status}
              industry={hit.industry}
              updatedAt={hit.updatedAt ? String(hit.updatedAt) : undefined}
              extras={hit.extras}
              watchlistData={{
                reference: hit.referenceRaw,
                manufacturer: hit.manufacturerName,
                manufacturerSlug: hit.manufacturerSlug,
                partSlug: hit.slug,
                name: hit.name,
                status: hit.status,
                minPrice: hit.extras?.minPrice ?? undefined,
                currency: hit.extras?.currency,
              }}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            aria-busy={isPending}
            className="rounded-full border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900 disabled:opacity-50"
          >
            {isPending ? "Chargement…" : "Afficher plus de résultats"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-600">
          Le chargement a échoué, veuillez réessayer.
        </p>
      )}
    </>
  );
}
