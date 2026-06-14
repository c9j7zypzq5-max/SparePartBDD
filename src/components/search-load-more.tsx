"use client";

import { useState, useTransition } from "react";
import { PartCard } from "@/components/part-card";
import type { SearchHit } from "@/lib/search/search-service";

const PAGE_SIZE = 20;

export function SearchLoadMore({
  initialHasMore,
  searchQuery,
}: {
  initialHasMore: boolean;
  searchQuery: string;
}) {
  const [extraHits, setExtraHits] = useState<SearchHit[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  const offset = PAGE_SIZE + extraHits.length;

  function loadMore() {
    startTransition(async () => {
      const params = new URLSearchParams(searchQuery);
      params.set("offset", String(offset));
      params.delete("page");
      const res = await fetch(`/api/recherche?${params.toString()}`);
      const hits: SearchHit[] = await res.json();
      const newHits = hits.slice(0, PAGE_SIZE);
      setExtraHits((prev) => [...prev, ...newHits]);
      setHasMore(hits.length > PAGE_SIZE);
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
              watchlistData={{
                reference: hit.referenceRaw,
                manufacturer: hit.manufacturerName,
                manufacturerSlug: hit.manufacturerSlug,
                partSlug: hit.slug,
                name: hit.name,
                status: hit.status,
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
            className="rounded-full border border-zinc-200 px-6 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-800 disabled:opacity-50"
          >
            {isPending ? "Chargement…" : "Charger plus"}
          </button>
        </div>
      )}
    </>
  );
}
