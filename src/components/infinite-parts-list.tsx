"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PartCard } from "./part-card";
import { PartCardSkeleton } from "./skeleton";
import type { PartCardExtras } from "@/lib/queries";

export type PartSummary = {
  id: number;
  slug: string;
  name: string;
  referenceRaw: string;
  status: string;
  manufacturerSlug: string;
  manufacturerName: string;
  updatedAt?: string | null;
  extras?: PartCardExtras;
};

/**
 * Liste paginée chargée au défilement (avec un bouton « Afficher plus » pour
 * le clavier et en cas d'échec de l'observateur).
 */
export function InfinitePartsList({
  apiPath,
  initialParts,
  totalCount,
  extraParams = {},
  initialOffset = 0,
}: {
  apiPath: string;
  initialParts: PartSummary[];
  totalCount: number;
  extraParams?: Record<string, string>;
  initialOffset?: number;
}) {
  const startOffset = initialOffset + initialParts.length;
  const [parts, setParts] = useState(initialParts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [exhausted, setExhausted] = useState(startOffset >= totalCount);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const offsetRef = useRef(startOffset);
  const exhaustedRef = useRef(startOffset >= totalCount);
  const extraParamsRef = useRef(extraParams);

  useEffect(() => {
    extraParamsRef.current = extraParams;
  }, [extraParams]);

  // Reset list when extraParams change (e.g. filter/page change navigates to new SSR page)
  const extraParamsKey = JSON.stringify(extraParams);
  useEffect(() => {
    const start = initialOffset + initialParts.length;
    setParts(initialParts);
    setError(false);
    offsetRef.current = start;
    exhaustedRef.current = start >= totalCount;
    setExhausted(start >= totalCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraParamsKey, initialOffset]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || exhaustedRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const qs = new URLSearchParams({
        offset: String(offsetRef.current),
        ...extraParamsRef.current,
      });
      const res = await fetch(`${apiPath}?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { parts: PartSummary[]; hasMore: boolean } = await res.json();
      setParts((prev) => [...prev, ...data.parts]);
      offsetRef.current += data.parts.length;
      if (!data.hasMore) {
        exhaustedRef.current = true;
        setExhausted(true);
      }
    } catch {
      // Pas de nouvel essai automatique : le bouton reste disponible.
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || error) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, error]);

  const shown = initialOffset + parts.length;

  return (
    <>
      <div className="mt-6 grid gap-3">
        {parts.map((part) => (
          <PartCard
            key={part.id}
            href={`/piece/${part.manufacturerSlug}/${part.slug}`}
            name={part.name}
            referenceRaw={part.referenceRaw}
            manufacturerName={part.manufacturerName}
            manufacturerSlug={part.manufacturerSlug}
            status={part.status}
            updatedAt={part.updatedAt ?? undefined}
            extras={part.extras}
            watchlistData={{
              reference: part.referenceRaw,
              manufacturer: part.manufacturerName,
              manufacturerSlug: part.manufacturerSlug,
              partSlug: part.slug,
              name: part.name,
              status: part.status,
              minPrice: part.extras?.minPrice ?? undefined,
              currency: part.extras?.currency,
            }}
          />
        ))}
      </div>
      {loading && (
        <div className="mt-3 grid gap-3" aria-hidden="true">
          {[0, 1, 2].map((i) => <PartCardSkeleton key={i} />)}
        </div>
      )}
      <div ref={sentinelRef} className="flex flex-col items-center gap-2 py-5 text-sm text-zinc-500">
        {totalCount > 0 && (
          <p aria-live="polite">
            {Math.min(shown, totalCount)} sur {totalCount} pièce{totalCount > 1 ? "s" : ""}
          </p>
        )}
        {error && <p role="alert" className="text-red-600">Le chargement a échoué.</p>}
        {!exhausted && !loading && (
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full border border-zinc-300 px-5 py-2 font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
          >
            {error ? "Réessayer" : "Afficher plus"}
          </button>
        )}
      </div>
    </>
  );
}
