"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PartCard } from "./part-card";

type PartSummary = {
  id: number;
  slug: string;
  name: string;
  referenceRaw: string;
  status: string;
};

export function InfinitePartsList({
  manufacturerSlug,
  manufacturerName,
  initialParts,
  totalCount,
}: {
  manufacturerSlug: string;
  manufacturerName: string;
  initialParts: PartSummary[];
  totalCount: number;
}) {
  const [parts, setParts] = useState(initialParts);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialParts.length >= totalCount);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Refs to avoid recreating the IntersectionObserver on every state change
  const loadingRef = useRef(false);
  const offsetRef = useRef(initialParts.length);
  const exhaustedRef = useRef(initialParts.length >= totalCount);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || exhaustedRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/marque/${manufacturerSlug}/parts?offset=${offsetRef.current}`,
      );
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
  }, [manufacturerSlug]);

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
            href={`/piece/${manufacturerSlug}/${part.slug}`}
            name={part.name}
            referenceRaw={part.referenceRaw}
            manufacturerName={manufacturerName}
            manufacturerSlug={manufacturerSlug}
            status={part.status}
            watchlistData={{
              reference: part.referenceRaw,
              manufacturer: manufacturerName,
              manufacturerSlug,
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
