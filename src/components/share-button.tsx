"use client";

import { useState } from "react";
import { readWatchlist } from "@/lib/watchlist";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const list = readWatchlist();
    if (list.length === 0) return;
    const refs = list.map((e) => e.reference).join(",");
    const url = `${window.location.origin}/liste/partage?refs=${encodeURIComponent(refs)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
        <path d="M11.25 3.25a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5zM4.5 3.75a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5H6v5.5h1.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1-.75-.75v-7zM9 7.75a.75.75 0 0 0 0 1.5h3.25a.75.75 0 0 0 0-1.5H9zM2.75 2a.75.75 0 0 0-.75.75v10.5c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V2.75a.75.75 0 0 0-.75-.75H2.75z" />
      </svg>
      {copied ? "Lien copié !" : "Partager la liste"}
    </button>
  );
}
