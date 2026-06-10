"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Suggestion {
  name: string;
  referenceRaw: string;
  manufacturerName: string;
  status: string;
  url: string;
}

export function SearchBar({
  defaultValue = "",
  autoFocus = false,
  large = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  large?: boolean;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2 || q === defaultValue) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.hits ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, defaultValue]);

  // Ferme la liste quand on clique ailleurs
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const inputSize = large ? "px-5 py-4 text-lg" : "px-4 py-3 text-base";
  const buttonSize = large ? "px-7 py-4 text-lg" : "px-6 py-3";

  return (
    <div ref={containerRef} className="relative w-full">
      <form action="/recherche" method="get" className="flex w-full gap-2">
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoFocus={autoFocus}
          required
          autoComplete="off"
          placeholder="Référence (ex : 6ES7214-1AG40, PWR-C1-715WAC) ou nom de pièce…"
          className={`w-full rounded-xl border border-zinc-300 bg-white text-zinc-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none ${inputSize}`}
        />
        <button
          type="submit"
          className={`shrink-0 rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 ${buttonSize}`}
        >
          Rechercher
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-lg">
          {suggestions.map((s) => (
            <li key={s.url} className="border-b border-zinc-100 last:border-0">
              <Link
                href={s.url}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50"
                onClick={() => setOpen(false)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono text-sm font-medium text-zinc-900">
                    {s.manufacturerName} {s.referenceRaw}
                  </span>
                  <span className="block truncate text-sm text-zinc-500">
                    {s.name}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "obsolete"
                      ? "bg-red-100 text-red-700"
                      : s.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {s.status === "obsolete"
                    ? "Obsolète"
                    : s.status === "active"
                      ? "Fabriquée"
                      : "?"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
