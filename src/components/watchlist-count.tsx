"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { readWatchlist } from "@/lib/watchlist";

export function WatchlistCount() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const active = pathname.startsWith("/liste");

  useEffect(() => {
    const refresh = () => setCount(readWatchlist().length);
    refresh();
    window.addEventListener("watchlist-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("watchlist-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <Link
      href="/liste"
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 px-1 py-2 ${
        active ? "text-zinc-900 underline decoration-blue-600 decoration-2 underline-offset-8" : "hover:text-zinc-900"
      }`}
    >
      Ma liste
      {count > 0 && (
        <span className="inline-block rounded-full bg-blue-600 px-1.5 py-px text-xs font-semibold leading-4 text-white">
          {count}
          <span className="sr-only"> pièce{count > 1 ? "s" : ""}</span>
        </span>
      )}
    </Link>
  );
}
