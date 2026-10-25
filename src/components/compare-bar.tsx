"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { readCompareList, clearCompareList, toggleCompare, type CompareEntry } from "@/lib/compare-list";
import { CloseIcon } from "./icons";

export function CompareBar() {
  const pathname = usePathname();
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

  // Inutile sur la page de comparaison elle-même.
  if (list.length === 0 || pathname === "/comparer") return null;

  const free = 3 - list.length;

  return (
    <div
      role="region"
      aria-label="Pièces à comparer"
      className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-violet-200 bg-white/95 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <ul className="hidden flex-1 flex-wrap items-center gap-2 sm:flex">
          {list.map((entry) => (
            <li
              key={`${entry.manufacturerSlug}/${entry.slug}`}
              className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1 text-xs"
            >
              <span className="font-mono font-medium text-zinc-900">
                {entry.manufacturerName} {entry.referenceRaw}
              </span>
              <button
                type="button"
                onClick={() => toggleCompare(entry)}
                aria-label={`Retirer ${entry.referenceRaw} de la comparaison`}
                className="rounded p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </li>
          ))}
          {free > 0 && (
            <li className="text-xs text-zinc-400">
              {free} emplacement{free > 1 ? "s" : ""} libre{free > 1 ? "s" : ""}
            </li>
          )}
        </ul>
        <p className="flex-1 text-sm text-zinc-600 sm:hidden">
          {list.length} pièce{list.length > 1 ? "s" : ""} à comparer
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={clearCompareList}
            className="text-xs text-zinc-500 underline hover:text-zinc-800"
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
