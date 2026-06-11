"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PartCard } from "./part-card";

type PartSummary = {
  id: number;
  slug: string;
  name: string;
  referenceRaw: string;
  status: string;
  manufacturerSlug: string;
  manufacturerName: string;
  updatedAt?: string | null;
};

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
    offsetRef.current = start;
    exhaustedRef.current = start >= totalCount;
    setExhausted(start >= totalCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraParamsKey, initialOffset]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || exhaustedRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        offset: String(offsetRef.current),
        ...extraParamsRef.current,
      });
      const res = await fetch(`${apiPath}?${qs.toString()}`);
      if (!res.ok) return;
      const data: { parts: PartSummary[]; hasMore: boolean } = await res.json();
      setParts((prev) => [...prev, ...data.parts]);
      offsetRef.current += data.parts.length;
      if (!data.hasMore) {
        exhaustedRef.current = true;
        setExhausted(true);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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
            watchlistData={{
              reference: part.referenceRaw,
              manufacturer: part.manufacturerName,
              manufacturerSlug: part.manufacturerSlug,
              partSlug: part.slug,
              name: part.name,
              status: part.status,
            }}
          />
        ))}
      </div>
      <div ref={sentinelRef} className="flex justify-center py-6">
        {loading && (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        )}
        {exhausted && !loading && (
          <p className="text-sm text-zinc-400">Fin des résultats</p>
        )}
      </div>
    </>
  );
}
