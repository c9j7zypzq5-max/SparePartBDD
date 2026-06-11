"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { readWatchlist } from "@/lib/watchlist";

export function WatchlistCount() {
  const [count, setCount] = useState(0);

  function refresh() {
    setCount(readWatchlist().length);
  }

  useEffect(() => {
    refresh();
    window.addEventListener("watchlist-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("watchlist-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <Link href="/liste" className="hover:text-zinc-900">
      Ma liste{count > 0 && <span className="ml-1 text-blue-600">({count})</span>}
    </Link>
  );
}
