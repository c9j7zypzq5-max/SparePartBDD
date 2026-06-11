"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCompareList, clearCompareList, type CompareEntry } from "@/lib/compare-list";

export function CompareBar() {
  const [list, setList] = useState<CompareEntry[]>([]);

  useEffect(() => {
    setList(readCompareList());
    function refresh() {
      setList(readCompareList());
    }
    window.addEventListener("compare-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("compare-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-violet-200 bg-white/95 backdrop-blur shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {list.map((entry) => (
            <div key={`${entry.manufacturerSlug}/${entry.slug}`} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs">
              <span className="font-mono font-medium text-zinc-900">{entry.manufacturerName} {entry.referenceRaw}</span>
            </div>
          ))}
          {list.length < 3 && (
            <span className="text-xs text-zinc-400">
              {3 - list.length} emplacement{3 - list.length > 1 ? "s" : ""} libre{3 - list.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clearCompareList}
            className="text-xs text-zinc-400 underline hover:text-zinc-700"
          >
            Vider
          </button>
          <Link
            href="/comparer"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Comparer ({list.length})
          </Link>
        </div>
      </div>
    </div>
  );
}
