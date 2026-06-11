"use client";

import { useState, useEffect } from "react";
import { toggleWatchlist, isInWatchlist } from "@/lib/watchlist";
import type { WatchlistEntry } from "@/lib/watchlist";

export function WatchlistButton({
  entry,
  className = "",
}: {
  entry: WatchlistEntry;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInWatchlist(entry.manufacturerSlug, entry.partSlug));
  }, [entry.manufacturerSlug, entry.partSlug]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = toggleWatchlist(entry);
    setSaved(nowSaved);
    window.dispatchEvent(new Event("watchlist-change"));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={saved ? "Retirer de ma liste" : "Ajouter à ma liste"}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
        saved
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
      } ${className}`}
    >
      {saved ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M2 2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-3.5 w-3.5"
        >
          <path d="M2 2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2z" />
        </svg>
      )}
      {saved ? "Sauvegardé" : "Ma liste"}
    </button>
  );
}
