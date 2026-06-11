"use client";

import { useEffect, useState } from "react";
import { toggleCompare, isInCompareList, type CompareEntry } from "@/lib/compare-list";

export function CompareButton({ entry }: { entry: Omit<CompareEntry, never> }) {
  const [inList, setInList] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setInList(isInCompareList(entry.manufacturerSlug, entry.slug));
    function refresh() {
      setInList(isInCompareList(entry.manufacturerSlug, entry.slug));
    }
    window.addEventListener("compare-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("compare-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [entry.manufacturerSlug, entry.slug]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleCompare(entry);
    if (result === "full") {
      setFlash("Max 3 pièces");
      setTimeout(() => setFlash(null), 1500);
    } else {
      setInList(result === "added");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={inList ? "Retirer de la comparaison" : "Comparer"}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
        inList
          ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
          : "border border-zinc-200 text-zinc-500 hover:border-violet-300 hover:text-violet-600"
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06l1.97-1.97H3.75a.75.75 0 0 1 0-1.5h6.44L8.22 6.28a.75.75 0 0 1 0-1.06ZM2 3.75A.75.75 0 0 1 2.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 2 3.75Zm0 8.5A.75.75 0 0 1 2.75 11.5h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
      {flash ?? (inList ? "Comparé" : "Comparer")}
    </button>
  );
}
